import os
import re
import uuid
from flask import request, jsonify, send_file
from werkzeug.utils import secure_filename

from config.db import get_connection
from utils.helpers import generate_secure_id

# =========================
# Regras / Config
# =========================
ALLOWED_EXTENSIONS = {"pdf", "csv", "xlsx"}
ALLOWED_MIMES = {
    # PDF
    "application/pdf",
    # CSV (varia conforme navegador/OS)
    "text/csv",
    "application/csv",
    "text/plain",
    "application/vnd.ms-excel",
    # XLSX
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

DOCS_BASE_DIR = os.getenv("DOCS_BASE_DIR", "docs")  # ./docs/...


# =========================
# Helpers
# =========================
def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _allowed_file(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower().strip()
    return ext in ALLOWED_EXTENSIONS


def _sanitize_folder_name(name: str) -> str:
    """
    Mantém apenas letras/números/_- e troca espaços por underscore.
    Evita caracteres estranhos em path.
    """
    name = (name or "").strip().replace(" ", "_")
    name = re.sub(r"[^a-zA-Z0-9_\-]", "", name)
    return name or "cliente"


def _customer_id_exists(cur, customer_id: str) -> bool:
    cur.execute(
        """
        SELECT 1
        FROM public.clientes
        WHERE id = %s
        LIMIT 1;
        """,
        (customer_id,),
    )
    return cur.fetchone() is not None


def _get_customer_folder_name(cur, id_cliente: str) -> str | None:
    """
    Retorna nome de pasta do cliente baseado no cadastro.
    Regra:
      1) first_name + last_name
      2) company_name
      3) code
      4) id_cliente
    """
    cur.execute(
        """
        SELECT
            COALESCE(NULLIF(first_name, ''), NULL)  AS first_name,
            COALESCE(NULLIF(last_name, ''), NULL)   AS last_name,
            COALESCE(NULLIF(company_name, ''), NULL) AS company_name,
            COALESCE(NULLIF(code, ''), NULL)        AS code
        FROM public.clientes
        WHERE id = %s
        LIMIT 1;
        """,
        (id_cliente,),
    )
    r = cur.fetchone()
    if not r:
        return None

    first_name, last_name, company_name, code = r

    full = " ".join([x for x in [first_name, last_name] if x]).strip()

    if full:
        base = full
    elif company_name:
        base = str(company_name)
    elif code:
        base = str(code)
    else:
        base = str(id_cliente)

    return _sanitize_folder_name(base)


def _safe_abs_path(caminho_arquivo: str) -> str:
    """
    Garante que o caminho do arquivo está dentro de DOCS_BASE_DIR.
    """
    if not caminho_arquivo:
        raise ValueError("Empty caminho_arquivo")

    base_abs = os.path.abspath(DOCS_BASE_DIR)
    file_abs = os.path.abspath(caminho_arquivo)

    if not file_abs.startswith(base_abs + os.sep) and file_abs != base_abs:
        raise ValueError("Unsafe file path")

    return file_abs


def _pick_api_error(data: any) -> str:
    if not data:
        return "Erro inesperado."
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        if isinstance(data.get("details"), str):
            return data["details"]
        if isinstance(data.get("error"), str):
            return data["error"]
    return "Falha ao processar a requisição."


def _save_file_for_customer(cur, id_cliente: str, categoria: str, file_storage):
    """
    Salva arquivo fisicamente e retorna caminho relativo (ex.: docs/Mariana_Alves/RG/uuid_nome.pdf)
    """
    original_name = file_storage.filename or ""
    if not _allowed_file(original_name):
        return None, (
            jsonify(
                {
                    "error": "Invalid file type",
                    "details": "Only PDF, CSV, XLSX are allowed",
                    "allowed_extensions": sorted(list(ALLOWED_EXTENSIONS)),
                }
            ),
            400,
        )

    mimetype = (file_storage.mimetype or "").lower().strip()
    if mimetype not in ALLOWED_MIMES:
        return None, (
            jsonify(
                {
                    "error": "Invalid mime type",
                    "details": "File mimetype not allowed",
                    "received": mimetype,
                }
            ),
            400,
        )

    folder_user = _get_customer_folder_name(cur, id_cliente)
    if not folder_user:
        return None, (
            jsonify(
                {
                    "error": "Invalid id_cliente",
                    "details": "id_cliente must exist in public.clientes.id",
                }
            ),
            400,
        )

    folder_categoria = _sanitize_folder_name(str(categoria))
    safe_name = secure_filename(original_name)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"

    rel_dir = os.path.join(folder_user, folder_categoria)
    abs_dir = os.path.join(DOCS_BASE_DIR, rel_dir)
    _ensure_dir(abs_dir)

    abs_path = os.path.join(abs_dir, unique_name)
    file_storage.save(abs_path)

    rel_path = os.path.join(DOCS_BASE_DIR, rel_dir, unique_name).replace("\\", "/")
    return rel_path, None


def _get_doc_by_id(cur, doc_id: str):
    cur.execute(
        """
        SELECT id, id_cliente, caminho_arquivo, categoria, data_envio
        FROM public.docs_clientes
        WHERE id = %s
        LIMIT 1;
        """,
        (doc_id,),
    )
    return cur.fetchone()


def _doc_to_json(r):
    return {
        "id": r[0],
        "id_cliente": r[1],
        "caminho_arquivo": r[2],
        "categoria": r[3],
        "data_envio": str(r[4]) if r[4] else None,
    }


# =========================
# CREATE - UPLOAD
# =========================
def upload_doc_cliente(current_user=None):
    """
    POST /docs-clientes/upload
    multipart/form-data:
      - file
      - id_cliente
      - categoria
    """
    file = request.files.get("file")
    id_cliente = request.form.get("id_cliente")
    categoria = request.form.get("categoria")

    if not file:
        return jsonify({"error": "Missing file", "details": "field 'file' is required"}), 400
    if not id_cliente:
        return jsonify({"error": "Missing id_cliente"}), 400
    if not categoria:
        return jsonify({"error": "Missing categoria"}), 400

    id_cliente = str(id_cliente).strip()
    if not id_cliente:
        return jsonify({"error": "Invalid id_cliente", "details": "id_cliente is required"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, id_cliente):
            return jsonify(
                {"error": "Invalid id_cliente", "details": "id_cliente must exist in public.clientes.id"}
            ), 400

        caminho_arquivo, err = _save_file_for_customer(cur, id_cliente, categoria, file)
        if err:
            return err  # (json, status)

        novo_id = generate_secure_id()

        cur.execute(
            """
            INSERT INTO public.docs_clientes (id, id_cliente, caminho_arquivo, categoria)
            VALUES (%s, %s, %s, %s)
            RETURNING id, id_cliente, caminho_arquivo, categoria, data_envio;
            """,
            (novo_id, id_cliente, caminho_arquivo, categoria),
        )
        r = cur.fetchone()
        conn.commit()

        return jsonify({"message": "Doc created", "doc": _doc_to_json(r)}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "create failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# LIST
# =========================
def list_docs_clientes(current_user=None, id_cliente: str | None = None, categoria: str | None = None):
    """
    GET /docs-clientes?id_cliente=<hash>&categoria=RG
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        sql = """
            SELECT id, id_cliente, caminho_arquivo, categoria, data_envio
            FROM public.docs_clientes
        """

        params = []
        where = []

        if id_cliente is not None and str(id_cliente).strip():
            where.append("id_cliente = %s")
            params.append(str(id_cliente).strip())

        if categoria:
            where.append("categoria = %s")
            params.append(categoria)

        if where:
            sql += " WHERE " + " AND ".join(where)

        sql += " ORDER BY data_envio DESC, id DESC;"

        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

        docs = [_doc_to_json(r) for r in rows]
        return jsonify({"docs": docs}), 200

    except Exception as e:
        return jsonify({"error": "list failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# GET BY ID (metadata)
# =========================
def get_doc_cliente(current_user=None, doc_id: str = ""):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        r = _get_doc_by_id(cur, doc_id)
        if not r:
            return jsonify({"error": "Doc not found"}), 404

        return jsonify({"doc": _doc_to_json(r)}), 200

    except Exception as e:
        return jsonify({"error": "get failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# READ/DOWNLOAD FILE
# =========================
def download_doc_cliente(current_user=None, doc_id: str = ""):
    """
    GET /docs-clientes/<id>/download
    Retorna o arquivo físico.
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        r = _get_doc_by_id(cur, doc_id)
        if not r:
            return jsonify({"error": "Doc not found"}), 404

        caminho_arquivo = r[2]
        abs_path = _safe_abs_path(caminho_arquivo)

        if not os.path.exists(abs_path):
            return jsonify({"error": "File not found on disk", "details": caminho_arquivo}), 404

        return send_file(abs_path, as_attachment=True)

    except Exception as e:
        return jsonify({"error": "download failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# UPDATE (metadata only)
# =========================
def update_doc_cliente(current_user=None, doc_id: str = ""):
    """
    PUT /docs-clientes/<id>
    JSON body:
      - categoria
      - id_cliente
    Não troca o arquivo, só atualiza metadados.
    """
    data = request.get_json(silent=True) or {}
    payload = {}

    if "categoria" in data:
        payload["categoria"] = data.get("categoria")
    if "id_cliente" in data:
        payload["id_cliente"] = data.get("id_cliente")

    if not payload:
        return jsonify({"error": "No valid fields to update"}), 400

    if "id_cliente" in payload:
        payload["id_cliente"] = str(payload["id_cliente"]).strip()
        if not payload["id_cliente"]:
            return jsonify({"error": "Invalid id_cliente"}), 400

    if "categoria" in payload:
        if not str(payload["categoria"] or "").strip():
            return jsonify({"error": "Invalid categoria"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        r = _get_doc_by_id(cur, doc_id)
        if not r:
            return jsonify({"error": "Doc not found"}), 404

        if "id_cliente" in payload:
            if not _customer_id_exists(cur, payload["id_cliente"]):
                return jsonify(
                    {"error": "Invalid id_cliente", "details": "id_cliente must exist in public.clientes.id"}
                ), 400

        set_parts = []
        values = []
        for k, v in payload.items():
            set_parts.append(f"{k} = %s")
            values.append(v)

        values.append(doc_id)

        cur.execute(
            f"""
            UPDATE public.docs_clientes
            SET {", ".join(set_parts)}
            WHERE id = %s;
            """,
            tuple(values),
        )

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Doc not found"}), 404

        conn.commit()
        return jsonify({"message": "Doc updated"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "update failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# REPLACE FILE (UPDATE ARQUIVO)
# =========================
def replace_doc_file(current_user=None, doc_id: str = ""):
    """
    PUT /docs-clientes/<id>/upload
    multipart/form-data:
      - file
      - (opcional) categoria
      - (opcional) id_cliente
    Substitui o arquivo e atualiza caminho_arquivo + data_envio.
    """
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Missing file", "details": "field 'file' is required"}), 400

    categoria = request.form.get("categoria")
    id_cliente = request.form.get("id_cliente")

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        old = _get_doc_by_id(cur, doc_id)
        if not old:
            return jsonify({"error": "Doc not found"}), 404

        old_id_cliente = old[1]
        old_path = old[2]
        old_categoria = old[3]

        new_id_cliente = old_id_cliente
        if id_cliente is not None and str(id_cliente).strip():
            new_id_cliente = str(id_cliente).strip()
            if not new_id_cliente:
                return jsonify({"error": "Invalid id_cliente"}), 400

            if not _customer_id_exists(cur, new_id_cliente):
                return jsonify(
                    {"error": "Invalid id_cliente", "details": "id_cliente must exist in public.clientes.id"}
                ), 400

        new_categoria = old_categoria
        if categoria is not None and str(categoria).strip():
            new_categoria = str(categoria).strip()

        new_path, err = _save_file_for_customer(cur, new_id_cliente, new_categoria, file)
        if err:
            return err

        cur.execute(
            """
            UPDATE public.docs_clientes
            SET id_cliente = %s,
                categoria = %s,
                caminho_arquivo = %s,
                data_envio = NOW()
            WHERE id = %s
            RETURNING id, id_cliente, caminho_arquivo, categoria, data_envio;
            """,
            (new_id_cliente, new_categoria, new_path, doc_id),
        )
        r = cur.fetchone()
        conn.commit()

        try:
            old_abs = _safe_abs_path(old_path)
            if os.path.exists(old_abs):
                os.remove(old_abs)
        except Exception:
            pass

        return jsonify({"message": "Doc file replaced", "doc": _doc_to_json(r)}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "replace failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# DELETE (DB + arquivo)
# =========================
def delete_doc_cliente(current_user=None, doc_id: str = ""):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        r = _get_doc_by_id(cur, doc_id)
        if not r:
            return jsonify({"error": "Doc not found"}), 404

        caminho_arquivo = r[2]

        cur.execute("DELETE FROM public.docs_clientes WHERE id = %s;", (doc_id,))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Doc not found"}), 404

        conn.commit()

        try:
            abs_path = _safe_abs_path(caminho_arquivo)
            if os.path.exists(abs_path):
                os.remove(abs_path)
        except Exception:
            pass

        return jsonify({"message": "Doc deleted"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "delete failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()