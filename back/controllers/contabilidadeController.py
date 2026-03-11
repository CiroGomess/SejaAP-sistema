import os
import pandas as pd
from math import ceil
from flask import request, jsonify
from config.db import get_connection

# =========================
# Config / Validation
# =========================
ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}

def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def _customer_id_exists(cur, user_id: int) -> bool:
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
            "descrição": "descricao", "descricao": "descricao", "description": "descricao",
            "valor (r$)": "valor", "valor": "valor", "value": "valor"
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
    file = request.files.get("file")
    user_id = request.form.get("user_id")
    ano = request.form.get("ano")
    categoria = request.form.get("categoria")

    if not file or not _allowed_file(file.filename):
        return jsonify({"error": "Invalid file"}), 400
    if not user_id or not ano:
        return jsonify({"error": "Missing user_id or ano"}), 400

    try:
        user_id = int(user_id)
        ano = int(ano)
    except ValueError:
        return jsonify({"error": "Invalid int format"}), 400

    parsed_data = _parse_file_data(file)
    if not parsed_data:
        return jsonify({"error": "Empty or invalid file data"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return jsonify({"error": "User not found"}), 404

        if categoria:
            cur.execute(
                "DELETE FROM public.contabilidade_dados WHERE user_id = %s AND ano = %s AND categoria = %s;",
                (user_id, ano, categoria)
            )
        else:
            cur.execute(
                "DELETE FROM public.contabilidade_dados WHERE user_id = %s AND ano = %s;",
                (user_id, ano)
            )

        insert_query = """
            INSERT INTO public.contabilidade_dados (user_id, ano, descricao, valor, categoria)
            VALUES (%s, %s, %s, %s, %s)
        """
        values_to_insert = [
            (user_id, ano, item["descricao"], item["valor"], categoria) 
            for item in parsed_data
        ]
        cur.executemany(insert_query, values_to_insert)
        conn.commit()

        return jsonify({
            "message": "Contabilidade data imported successfully",
            "rows_imported": len(values_to_insert),
            "ano": ano,
            "user_id": user_id,
            "categoria": categoria
        }), 201

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": "DB Error", "details": str(e)}), 500
    finally:
        if conn: conn.close()

# =========================
# LIST WITH PAGINATION
# =========================
def get_contabilidade_dados(current_user=None):
    """
    GET /contabilidade?user_id=10&ano=2024&page=1&per_page=10
    """
    user_id = request.args.get("user_id", type=int)
    ano = request.args.get("ano", type=int)
    
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)

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
        # Add limit/offset params to existing params list
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
        if conn: conn.close()