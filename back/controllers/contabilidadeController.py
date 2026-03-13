import os
import pandas as pd
from math import ceil
from flask import request, jsonify
from config.db import get_connection
from datetime import datetime, date
from utils.helpers import generate_secure_id

# =========================
# Config / Validation
# =========================
ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}

def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def _customer_id_exists(cur, user_id: str) -> bool:
    cur.execute("SELECT 1 FROM public.clientes WHERE id = %s LIMIT 1;", (user_id,))
    return cur.fetchone() is not None

def _parse_file_data(file_storage) -> list[dict] | None:
    try:
        filename = file_storage.filename.lower()
        if filename.endswith(".csv"):
            df = pd.read_csv(file_storage)
        else:
            df = pd.read_excel(file_storage)

        df.columns = [str(c).strip().lower() for c in df.columns]

        col_map = {
            "descrição": "descricao",
            "descricao": "descricao",
            "description": "descricao",
            "valor (r$)": "valor",
            "valor": "valor",
            "value": "valor",
        }
        df.rename(columns=col_map, inplace=True)

        if "descricao" not in df.columns or "valor" not in df.columns:
            return None

        data = []
        for _, row in df.iterrows():
            desc = str(row["descricao"]).strip()
            val_str = str(row["valor"]).replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
            try:
                val = float(val_str)
            except ValueError:
                val = 0.0

            if not desc or desc.lower() == "descrição":
                continue

            data.append({"descricao": desc, "valor": val})
        return data
    except Exception as e:
        print(f"Error parsing file: {e}")
        return None

# =========================
# UPLOAD
# =========================
def upload_contabilidade(current_user=None):
    """
    Faz o upload de dados contábeis, acumulando-os no banco de dados.
    Lê colunas de Descrição, Valor e Registro/Data.
    """
    file = request.files.get("file")
    user_id = request.form.get("user_id")
    ano = request.form.get("ano")
    categoria = request.form.get("categoria")

    # 1. Validações Iniciais
    if not file:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
    if not user_id or not ano:
        return jsonify({"error": "user_id e ano são obrigatórios"}), 400

    user_id = str(user_id).strip()
    if not user_id:
        return jsonify({"error": "user_id é obrigatório"}), 400

    try:
        ano = int(ano)
    except (ValueError, TypeError):
        return jsonify({"error": "ano deve ser número inteiro"}), 400

    if not file.filename or not _allowed_file(file.filename):
        return jsonify({"error": "Formato de arquivo inválido. Envie csv, xlsx ou xls"}), 400

    # 2. Parse do Arquivo
    try:
        file.seek(0)
        filename = file.filename.lower()

        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(file, sep=",")
                if len(df.columns) < 2:
                    raise Exception()
            except Exception:
                file.seek(0)
                df = pd.read_csv(file, sep=";")
        else:
            df = pd.read_excel(file)

        parsed_data = df.to_dict(orient="records")
    except Exception as e:
        return jsonify({"error": "Erro ao ler arquivo", "details": str(e)}), 400

    if not parsed_data:
        return jsonify({"error": "O arquivo está vazio"}), 400

    # 3. Processamento e Inserção no Banco
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return jsonify({"error": "Invalid user_id", "details": "user_id must exist in public.clientes.id"}), 400

        insert_query = """
            INSERT INTO public.contabilidade_dados
                (id, user_id, ano, descricao, valor, categoria, data_registro)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        values_to_insert = []
        for item in parsed_data:
            data_raw = None
            desc = None
            val = None

            # Busca dinâmica: ignora maiúsculas, espaços e acentos nos nomes das colunas
            for key, value in item.items():
                k_norm = str(key).strip().lower().replace(" ", "").replace("-", "").replace("_", "")

                if "registro" in k_norm or "data" in k_norm:
                    data_raw = value
                elif "desc" in k_norm:
                    desc = value
                elif "valor" in k_norm or "val" in k_norm:
                    val = value

            # Conversão segura da data para objeto date do Python
            data_formatada = None
            if data_raw and str(data_raw).lower() != "nan":
                if isinstance(data_raw, (date, datetime)):
                    data_formatada = data_raw if isinstance(data_raw, date) else data_raw.date()
                elif isinstance(data_raw, str) and data_raw.strip():
                    data_clean = data_raw.strip().split(" ")[0]
                    try:
                        data_formatada = datetime.strptime(data_clean, "%d/%m/%Y").date()
                    except ValueError:
                        try:
                            data_formatada = date.fromisoformat(data_clean)
                        except Exception:
                            data_formatada = None

            # Conversão segura do valor
            valor_float = 0.0
            if val is not None and str(val).strip() != "":
                try:
                    valor_float = float(str(val).replace("R$", "").replace(" ", "").replace(".", "").replace(",", "."))
                except Exception:
                    valor_float = 0.0

            # Geração do ID seguro por linha
            novo_id = generate_secure_id()

            values_to_insert.append((
                novo_id,
                user_id,
                ano,
                str(desc).strip() if desc and str(desc).strip() else "Sem descrição",
                valor_float,
                categoria,
                data_formatada,
            ))

        # Executa o insert em massa (bulk insert)
        if values_to_insert:
            cur.executemany(insert_query, values_to_insert)
            conn.commit()

        return jsonify({
            "message": "Dados acumulados com sucesso!",
            "rows_inserted": len(values_to_insert),
            "user_id": user_id,
            "ano": ano
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "Erro de Banco de Dados", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# LIST WITH PAGINATION
# =========================
def get_contabilidade_dados(current_user=None):
    """
    GET /contabilidade?user_id=<hash>&ano=2024&page=1&per_page=10
    """
    user_id = request.args.get("user_id")
    ano = request.args.get("ano", type=int)

    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    user_id = str(user_id).strip()
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    # Paginação rules
    allowed_per_page = {10, 50, 100}
    if per_page not in allowed_per_page:
        return jsonify({"error": "Invalid per_page. Allowed: 10, 50, 100"}), 400

    if page < 1:
        page = 1

    offset = (page - 1) * per_page

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # WHERE dinâmico
        where_parts = ["user_id = %s"]
        params = [user_id]

        if ano:
            where_parts.append("ano = %s")
            params.append(ano)

        where_sql = " WHERE " + " AND ".join(where_parts)

        # TOTAL count
        cur.execute(
            f"SELECT COUNT(*) FROM public.contabilidade_dados{where_sql};",
            tuple(params)
        )
        total_items = cur.fetchone()[0] or 0
        total_pages = ceil(total_items / per_page) if total_items > 0 else 0

        # Page out of bounds check
        if total_pages > 0 and page > total_pages:
            return jsonify({
                "data": [],
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "items_on_page": 0,
                    "total_items": total_items,
                    "total_pages": total_pages,
                }
            }), 200

        # DATA query
        sql = f"""
            SELECT id, ano, descricao, valor, categoria, data_importacao
            FROM public.contabilidade_dados
            {where_sql}
            ORDER BY id ASC
            LIMIT %s OFFSET %s;
        """
        query_params = params + [per_page, offset]

        cur.execute(sql, tuple(query_params))
        rows = cur.fetchall()

        data = []
        for r in rows:
            data.append({
                "id": r[0],
                "ano": r[1],
                "descricao": r[2],
                "valor": float(r[3]) if r[3] is not None else 0.0,
                "categoria": r[4],
                "data_importacao": str(r[5]) if r[5] else None
            })

        return jsonify({
            "data": data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "items_on_page": len(data),
                "total_items": total_items,
                "total_pages": total_pages,
            }
        }), 200

    except Exception as e:
        return jsonify({"error": "Fetch failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def get_contabilidade_dashboard(current_user=None):
    """
    GET /contabilidade/dashboard?user_id=<hash>&ano=2026

    Regras:
    - filtro principal pelo campo ano
    - gráfico mensal pelo mês de data_registro
    - receitas = soma dos valores positivos
    - despesas = soma absoluta dos valores negativos
    - resultado = receitas - despesas
    - margem_percentual = resultado / receitas * 100
    """
    user_id = request.args.get("user_id")
    ano = request.args.get("ano", type=int)

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    user_id = str(user_id).strip()
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # =========================
        # Anos disponíveis
        # =========================
        cur.execute(
            """
            SELECT DISTINCT ano
            FROM public.contabilidade_dados
            WHERE user_id = %s
            ORDER BY ano DESC;
            """,
            (user_id,),
        )
        anos_disponiveis = [int(r[0]) for r in cur.fetchall() if r[0] is not None]

        if not anos_disponiveis:
            return jsonify({
                "filtros": {
                    "user_id": user_id,
                    "ano": ano,
                    "anos_disponiveis": [],
                },
                "resumo": {
                    "receitas": 0.0,
                    "despesas": 0.0,
                    "resultado": 0.0,
                    "margem_percentual": 0.0,
                    "total_registros_ano": 0,
                    "label_total_registros": "0 registros contábeis"
                },
                "mensal": [],
                "top_descricoes": [],
                "top_categorias": [],
            }), 200

        ano_filtrado = ano if ano else anos_disponiveis[0]

        # =========================
        # Total de registros no ano
        # =========================
        cur.execute(
            """
            SELECT COUNT(*)
            FROM public.contabilidade_dados
            WHERE user_id = %s AND ano = %s;
            """,
            (user_id, ano_filtrado),
        )
        total_registros_ano = cur.fetchone()[0] or 0

        # =========================
        # Totais principais
        # =========================
        cur.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN valor > 0 THEN valor ELSE 0 END), 0) AS receitas,
                COALESCE(SUM(CASE WHEN valor < 0 THEN ABS(valor) ELSE 0 END), 0) AS despesas
            FROM public.contabilidade_dados
            WHERE user_id = %s AND ano = %s;
            """,
            (user_id, ano_filtrado),
        )
        totals_row = cur.fetchone()

        receitas = float(totals_row[0] or 0)
        despesas = float(totals_row[1] or 0)
        resultado = receitas - despesas
        margem_percentual = ((resultado / receitas) * 100) if receitas > 0 else 0.0

        # =========================
        # Gráfico mensal
        # =========================
        cur.execute(
            """
            SELECT
                EXTRACT(MONTH FROM data_registro)::INT AS mes,
                COALESCE(SUM(CASE WHEN valor > 0 THEN valor ELSE 0 END), 0) AS receitas,
                COALESCE(SUM(CASE WHEN valor < 0 THEN ABS(valor) ELSE 0 END), 0) AS despesas
            FROM public.contabilidade_dados
            WHERE user_id = %s
              AND ano = %s
              AND data_registro IS NOT NULL
            GROUP BY EXTRACT(MONTH FROM data_registro)
            ORDER BY mes ASC;
            """,
            (user_id, ano_filtrado),
        )

        month_map = {
            1: "Jan",
            2: "Fev",
            3: "Mar",
            4: "Abr",
            5: "Mai",
            6: "Jun",
            7: "Jul",
            8: "Ago",
            9: "Set",
            10: "Out",
            11: "Nov",
            12: "Dez",
        }

        mensal_base = {
            i: {
                "mes_numero": i,
                "mes": month_map[i],
                "receitas": 0.0,
                "despesas": 0.0,
                "resultado": 0.0,
            }
            for i in range(1, 13)
        }

        for row in cur.fetchall():
            mes = int(row[0] or 0)
            if mes in mensal_base:
                receitas_mes = float(row[1] or 0)
                despesas_mes = float(row[2] or 0)
                mensal_base[mes] = {
                    "mes_numero": mes,
                    "mes": month_map[mes],
                    "receitas": round(receitas_mes, 2),
                    "despesas": round(despesas_mes, 2),
                    "resultado": round(receitas_mes - despesas_mes, 2),
                }

        mensal = [mensal_base[i] for i in range(1, 13)]

        # =========================
        # Top descrições
        # =========================
        cur.execute(
            """
            SELECT
                descricao,
                COALESCE(categoria, 'Sem categoria') AS categoria,
                COALESCE(SUM(valor), 0) AS total_valor,
                COALESCE(SUM(ABS(valor)), 0) AS total_absoluto,
                COUNT(*) AS total_itens
            FROM public.contabilidade_dados
            WHERE user_id = %s AND ano = %s
            GROUP BY descricao, COALESCE(categoria, 'Sem categoria')
            ORDER BY total_absoluto DESC, descricao ASC
            LIMIT 10;
            """,
            (user_id, ano_filtrado),
        )

        top_descricoes = []
        rows_descricoes = cur.fetchall()

        for idx, row in enumerate(rows_descricoes, start=1):
            valor_item = float(row[2] or 0)
            percentual = ((abs(valor_item) / receitas) * 100) if receitas > 0 else 0.0

            top_descricoes.append({
                "rank": idx,
                "descricao": row[0],
                "categoria": row[1],
                "valor": round(valor_item, 2),
                "total_itens": int(row[4] or 0),
                "percentual_sobre_receitas": round(percentual, 2),
                "tipo": "receita" if valor_item >= 0 else "despesa",
                "label_rank": f"{idx}º mais relevante",
            })

        # =========================
        # Top categorias
        # =========================
        cur.execute(
            """
            SELECT
                COALESCE(categoria, 'Sem categoria') AS categoria,
                COALESCE(SUM(valor), 0) AS total_valor,
                COALESCE(SUM(ABS(valor)), 0) AS total_absoluto,
                COUNT(*) AS total_itens
            FROM public.contabilidade_dados
            WHERE user_id = %s AND ano = %s
            GROUP BY COALESCE(categoria, 'Sem categoria')
            ORDER BY total_absoluto DESC, categoria ASC
            LIMIT 10;
            """,
            (user_id, ano_filtrado),
        )

        top_categorias = []
        rows_categorias = cur.fetchall()

        for idx, row in enumerate(rows_categorias, start=1):
            valor_cat = float(row[1] or 0)
            percentual = ((abs(valor_cat) / receitas) * 100) if receitas > 0 else 0.0

            top_categorias.append({
                "rank": idx,
                "categoria": row[0],
                "valor": round(valor_cat, 2),
                "total_itens": int(row[3] or 0),
                "percentual_sobre_receitas": round(percentual, 2),
                "tipo": "receita" if valor_cat >= 0 else "despesa",
                "label_rank": f"{idx}º mais relevante",
            })

        return jsonify({
            "filtros": {
                "user_id": user_id,
                "ano": ano_filtrado,
                "anos_disponiveis": anos_disponiveis,
            },
            "resumo": {
                "receitas": round(receitas, 2),
                "despesas": round(despesas, 2),
                "resultado": round(resultado, 2),
                "margem_percentual": round(margem_percentual, 2),
                "total_registros_ano": total_registros_ano,
                "label_total_registros": f"{total_registros_ano} registros contábeis em {ano_filtrado}",
            },
            "mensal": mensal,
            "top_descricoes": top_descricoes,
            "top_categorias": top_categorias,
        }), 200

    except Exception as e:
        return jsonify({"error": "Dashboard fetch failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()