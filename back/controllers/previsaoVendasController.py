from decimal import Decimal, InvalidOperation
from flask import request, jsonify
from config.db import get_connection
from utils.helpers import generate_secure_id


FIELDS = {
    "user_id",
    "produto_ou_servico",
    "quantidade",
    "valor_unitario",
    "valor_total",
    "status",
}


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


def _try_calc_valor_total(payload: dict) -> None:
    if payload.get("valor_total") is not None:
        return

    q = payload.get("quantidade")
    vu = payload.get("valor_unitario")

    if q is None or vu is None:
        return

    try:
        payload["valor_total"] = (
            Decimal(str(q)) * Decimal(str(vu))
        ).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        pass


# =========================
# CREATE
# =========================
def create_previsao_venda(current_user=None):
    data = request.get_json(silent=True) or {}

    required = ["user_id", "produto_ou_servico"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    payload = {k: data.get(k) for k in FIELDS if k in data}

    payload["user_id"] = str(payload["user_id"]).strip()
    if not payload["user_id"]:
        return jsonify({"error": "Invalid user_id"}), 400

    if "status" not in payload:
        payload["status"] = "NAO_FATURADO"

    _try_calc_valor_total(payload)

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, payload["user_id"]):
            return jsonify(
                {
                    "error": "Invalid user_id",
                    "details": "user_id must exist in public.clientes.id",
                }
            ), 400

        novo_id = generate_secure_id()

        columns = ["id"] + list(payload.keys())
        values = [novo_id] + [payload[c] for c in payload.keys()]
        placeholders = ", ".join(["%s"] * len(columns))

        sql = f"""
            INSERT INTO public.previsao_vendas ({", ".join(columns)})
            VALUES ({placeholders})
            RETURNING
                id, user_id, produto_ou_servico,
                quantidade, valor_unitario, valor_total, status;
        """

        cur.execute(sql, tuple(values))
        r = cur.fetchone()
        conn.commit()

        return jsonify(
            {
                "message": "Previsão de venda criada",
                "previsao_venda": {
                    "id": r[0],
                    "user_id": r[1],
                    "produto_ou_servico": r[2],
                    "quantidade": str(r[3]) if r[3] is not None else None,
                    "valor_unitario": str(r[4]) if r[4] is not None else None,
                    "valor_total": str(r[5]) if r[5] is not None else None,
                    "status": r[6],
                },
            }
        ), 201

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
def list_previsao_vendas(current_user=None, user_id: str | None = None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        sql = """
            SELECT
                id, user_id, produto_ou_servico,
                quantidade, valor_unitario, valor_total, status
            FROM public.previsao_vendas
        """

        params = ()
        if user_id:
            sql += " WHERE user_id = %s"
            params = (str(user_id).strip(),)

        sql += " ORDER BY id ASC;"

        cur.execute(sql, params)
        rows = cur.fetchall()

        data = []
        for r in rows:
            data.append(
                {
                    "id": r[0],
                    "user_id": r[1],
                    "produto_ou_servico": r[2],
                    "quantidade": str(r[3]) if r[3] is not None else None,
                    "valor_unitario": str(r[4]) if r[4] is not None else None,
                    "valor_total": str(r[5]) if r[5] is not None else None,
                    "status": r[6],
                }
            )

        return jsonify({"previsao_vendas": data}), 200

    except Exception as e:
        return jsonify({"error": "list failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# GET
# =========================
def get_previsao_venda(current_user=None, venda_id: str = ""):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id, user_id, produto_ou_servico,
                quantidade, valor_unitario, valor_total, status
            FROM public.previsao_vendas
            WHERE id = %s
            LIMIT 1;
            """,
            (venda_id,),
        )

        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Registro não encontrado"}), 404

        return jsonify(
            {
                "previsao_venda": {
                    "id": r[0],
                    "user_id": r[1],
                    "produto_ou_servico": r[2],
                    "quantidade": str(r[3]) if r[3] is not None else None,
                    "valor_unitario": str(r[4]) if r[4] is not None else None,
                    "valor_total": str(r[5]) if r[5] is not None else None,
                    "status": r[6],
                }
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "get failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# UPDATE
# =========================
def update_previsao_venda(current_user=None, venda_id: str = ""):
    data = request.get_json(silent=True) or {}
    payload = {k: data[k] for k in data.keys() if k in FIELDS}

    if not payload:
        return jsonify({"error": "No valid fields to update"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if "user_id" in payload:
            payload["user_id"] = str(payload["user_id"]).strip()
            if not payload["user_id"]:
                return jsonify({"error": "Invalid user_id"}), 400

            if not _customer_id_exists(cur, payload["user_id"]):
                return jsonify(
                    {
                        "error": "Invalid user_id",
                        "details": "user_id must exist in public.clientes.id",
                    }
                ), 400

        need_recalc = (
            "valor_total" not in payload
            and ("quantidade" in payload or "valor_unitario" in payload)
        )

        if need_recalc:
            cur.execute(
                """
                SELECT quantidade, valor_unitario
                FROM public.previsao_vendas
                WHERE id = %s;
                """,
                (venda_id,),
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Registro não encontrado"}), 404

            q_old, vu_old = row
            q_new = payload.get("quantidade", q_old)
            vu_new = payload.get("valor_unitario", vu_old)

            try:
                payload["valor_total"] = (
                    Decimal(str(q_new)) * Decimal(str(vu_new))
                ).quantize(Decimal("0.01"))
            except (InvalidOperation, ValueError, TypeError):
                pass

        set_parts = []
        values = []

        for k, v in payload.items():
            set_parts.append(f"{k} = %s")
            values.append(v)

        values.append(venda_id)

        cur.execute(
            f"""
            UPDATE public.previsao_vendas
            SET {", ".join(set_parts)}
            WHERE id = %s;
            """,
            tuple(values),
        )

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Registro não encontrado"}), 404

        conn.commit()
        return jsonify({"message": "Previsão de venda atualizada"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "update failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# DELETE
# =========================
def delete_previsao_venda(current_user=None, venda_id: str = ""):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM public.previsao_vendas WHERE id = %s;", (venda_id,))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Registro não encontrado"}), 404

        conn.commit()
        return jsonify({"message": "Previsão de venda removida"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "delete failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()