import re
from io import BytesIO
from decimal import Decimal, InvalidOperation

from flask import request, jsonify
from openpyxl import load_workbook

from config.db import get_connection

# Reaproveita suas funções de salvar docs
from controllers.uploadDocsController import (
    _customer_id_exists,
    _save_file_for_customer,
)

DOCS_IMPORT_CATEGORIA_DEFAULT = "ANALISE_MARGEM_XLSX"


# -------------------------
# Helpers XLSX
# -------------------------
def _norm_header(s: str) -> str:
    s = (s or "").strip().lower()
    s = s.replace("ç", "c")
    s = s.replace("ã", "a").replace("á", "a").replace("à", "a").replace("â", "a")
    s = s.replace("é", "e").replace("ê", "e")
    s = s.replace("í", "i")
    s = s.replace("ó", "o").replace("ô", "o")
    s = s.replace("ú", "u")
    s = re.sub(r"[^a-z0-9_ ]", "", s)
    s = s.replace(" ", "_")
    return s


def _to_str(v):
    if v is None:
        return ""
    return str(v).strip()


def _to_decimal(v, default=None):
    """
    Aceita:
      - 6,70
      - 6.70
      - 1.234,56
      - 1234.56
    """
    if v is None or str(v).strip() == "":
        return default
    try:
        if isinstance(v, (int, float, Decimal)):
            return Decimal(str(v)).quantize(Decimal("0.01"))

        s = str(v).strip()

        # caso: tem "," como decimal -> remove "." milhar e troca "," por "."
        if "," in s:
            s = s.replace(".", "").replace(",", ".")
        return Decimal(s).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return default


def _try_calc_margem_bruta(payload: dict) -> None:
    """
    margem_bruta = custo + hora_homem + frete
                   + impostos (%) + comissão (%)
    """
    if payload.get("margem_bruta") is not None:
        return

    try:
        custo = Decimal(str(payload.get("custo", 0) or 0))
        hora = Decimal(str(payload.get("hora_homem", 0) or 0))
        frete = Decimal(str(payload.get("frete", 0) or 0))

        imposto_pct = Decimal(str(payload.get("imposto", 0) or 0)) / 100
        comissao_pct = Decimal(str(payload.get("comissao", 0) or 0)) / 100

        base = custo + hora + frete
        impostos = base * imposto_pct
        comissao = base * comissao_pct

        payload["margem_bruta"] = (base + impostos + comissao).quantize(Decimal("0.01"))
    except Exception:
        # se não der pra calcular, só deixa como None
        pass


def _read_xlsx_rows(file_bytes: bytes) -> list[dict]:
    """
    Lê a primeira sheet e retorna lista de dicts normalizados.
    Espera headers como na imagem:
      PRODUTO OU SERVIÇO | CUSTO | HORA HOMEM | IMPOSTO | MARGEM BRUTA | COMISSÃO | FRETE
    """
    wb = load_workbook(filename=BytesIO(file_bytes), data_only=True)
    ws = wb.active

    # Headers (linha 1)
    headers = [_norm_header(_to_str(c.value)) for c in ws[1]]
    idx = {h: i for i, h in enumerate(headers) if h}

    # alias para tolerar pequenas variações
    # (ex.: "produto_ou_servico" ou "produto_ou_servico_")
    aliases = {
        "produto_ou_servico": ["produto_ou_servico", "produto_ou_servico_", "produto_servico"],
        "custo": ["custo"],
        "hora_homem": ["hora_homem", "hora_homens", "hora_homem_"],
        "imposto": ["imposto", "impostos"],
        "margem_bruta": ["margem_bruta", "margem", "margem_bruta_"],
        "comissao": ["comissao", "comissao_"],
        "frete": ["frete"],
    }

    def _find_key(possible_keys: list[str]) -> int | None:
        for k in possible_keys:
            if k in idx:
                return idx[k]
        return None

    map_idx = {k: _find_key(v) for k, v in aliases.items()}

    def get(row, key, default=None):
        i = map_idx.get(key)
        if i is None:
            return default
        if i >= len(row):
            return default
        return row[i]

    out = []
    for row_cells in ws.iter_rows(min_row=2, values_only=True):
        if not any([c is not None and str(c).strip() != "" for c in row_cells]):
            continue

        item = {
            "produto_ou_servico": _to_str(get(row_cells, "produto_ou_servico")) or None,
            "custo": _to_decimal(get(row_cells, "custo"), default=None),
            "hora_homem": _to_decimal(get(row_cells, "hora_homem"), default=None),
            "imposto": _to_decimal(get(row_cells, "imposto"), default=None),       # % (ex 12.5)
            "margem_bruta": _to_decimal(get(row_cells, "margem_bruta"), default=None),
            "comissao": _to_decimal(get(row_cells, "comissao"), default=None),     # % (ex 5)
            "frete": _to_decimal(get(row_cells, "frete"), default=None),
        }

        # se o excel não trouxe margem_bruta, calcula
        _try_calc_margem_bruta(item)

        out.append(item)

    return out


# -------------------------
# Nova rota: upload + import
# -------------------------
def import_analise_margem_xlsx(current_user=None):
   
    file = request.files.get("file")
    id_cliente = request.form.get("id_cliente")
    categoria = (request.form.get("categoria") or DOCS_IMPORT_CATEGORIA_DEFAULT).strip()

    if not file:
        return jsonify({"error": "Missing file", "details": "field 'file' is required"}), 400
    if not id_cliente:
        return jsonify({"error": "Missing id_cliente"}), 400

    try:
        user_id = int(id_cliente)
        if user_id <= 0:
            raise ValueError()
    except Exception:
        return jsonify({"error": "Invalid id_cliente", "details": "id_cliente must be a positive integer"}), 400

    file_bytes = file.read()
    if not file_bytes:
        return jsonify({"error": "Empty file"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # valida cliente
        if not _customer_id_exists(cur, user_id):
            return jsonify(
                {"error": "Invalid id_cliente", "details": "id_cliente must exist in public.clientes.id"}
            ), 400

        # 1) salva arquivo físico + registra em docs_clientes
        file.stream = BytesIO(file_bytes)
        file.stream.seek(0)

        caminho_arquivo, err = _save_file_for_customer(cur, user_id, categoria, file)
        if err:
            return err

        cur.execute(
            """
            INSERT INTO public.docs_clientes (id_cliente, caminho_arquivo, categoria)
            VALUES (%s, %s, %s)
            RETURNING id, id_cliente, caminho_arquivo, categoria, data_envio;
            """,
            (user_id, caminho_arquivo, categoria),
        )
        doc_row = cur.fetchone()

        # 2) parse XLSX
        mapped = _read_xlsx_rows(file_bytes)
        if not mapped:
            conn.rollback()
            return jsonify({"error": "No rows found", "details": "XLSX has no data rows"}), 400

        # 3) monta payloads e insere em lote
        insert_sql = """
            INSERT INTO public.analise_margem
            (user_id, produto_ou_servico, custo, hora_homem, imposto, margem_bruta, comissao, frete)
            VALUES
            (%s,%s,%s,%s,%s,%s,%s,%s);
        """

        values = []
        for it in mapped:
            # produto_ou_servico é obrigatório no seu CREATE (junto do user_id)
            if not it.get("produto_ou_servico"):
                # pula linha vazia nessa coluna
                continue

            values.append(
                (
                    user_id,
                    it.get("produto_ou_servico"),
                    str(it["custo"]) if it.get("custo") is not None else None,
                    str(it["hora_homem"]) if it.get("hora_homem") is not None else None,
                    str(it["imposto"]) if it.get("imposto") is not None else None,
                    str(it["margem_bruta"]) if it.get("margem_bruta") is not None else None,
                    str(it["comissao"]) if it.get("comissao") is not None else None,
                    str(it["frete"]) if it.get("frete") is not None else None,
                )
            )

        if not values:
            conn.rollback()
            return jsonify(
                {"error": "No valid rows", "details": "No rows with 'produto_ou_servico' found"}
            ), 400

        cur.executemany(insert_sql, values)
        conn.commit()

        doc_json = {
            "id": doc_row[0],
            "id_cliente": doc_row[1],
            "caminho_arquivo": doc_row[2],
            "categoria": doc_row[3],
            "data_envio": str(doc_row[4]) if doc_row[4] else None,
        }

        return jsonify(
            {
                "message": "XLSX imported and analise_margem rows created",
                "doc": doc_json,
                "rows_mapped": len(mapped),
                "rows_inserted": len(values),
                "mapped_preview": mapped[:5],
            }
        ), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "import failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()
