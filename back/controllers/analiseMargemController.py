from decimal import Decimal, InvalidOperation
from flask import request, jsonify
from config.db import get_connection
from math import ceil


FIELDS = {
    "user_id",  # BIGINT -> clientes.id
    "produto_ou_servico",
    "custo",
    "hora_homem",
    "imposto",
    "margem_bruta",
    "comissao",
    "frete",
}



ALLOWED_PER_PAGE = {10, 50, 100}
DEFAULT_PER_PAGE = 10



def _customer_id_exists(cur, customer_id: int) -> bool:
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


def _try_calc_margem_bruta(payload: dict) -> None:
    """
    margem_bruta = custo + hora_homem + frete
                   + impostos (%) + comissão (%)
    """
    if payload.get("margem_bruta") is not None:
        return

    try:
        custo = Decimal(str(payload.get("custo", 0)))
        hora = Decimal(str(payload.get("hora_homem", 0)))
        frete = Decimal(str(payload.get("frete", 0)))

        imposto_pct = Decimal(str(payload.get("imposto", 0))) / 100
        comissao_pct = Decimal(str(payload.get("comissao", 0))) / 100

        base = custo + hora + frete
        impostos = base * imposto_pct
        comissao = base * comissao_pct

        payload["margem_bruta"] = (base + impostos + comissao).quantize(
            Decimal("0.01")
        )

    except (InvalidOperation, ValueError, TypeError):
        pass


# =========================
# CREATE
# =========================
def create_analise_margem(current_user=None):
    data = request.get_json(silent=True) or {}

    required = ["user_id", "produto_ou_servico"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    payload = {k: data.get(k) for k in FIELDS if k in data}

    _try_calc_margem_bruta(payload)

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

        columns = list(payload.keys())
        values = [payload[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))

        sql = f"""
            INSERT INTO public.analise_margem ({", ".join(columns)})
            VALUES ({placeholders})
            RETURNING
                id, user_id, produto_ou_servico, custo, hora_homem,
                imposto, margem_bruta, comissao, frete;
        """

        cur.execute(sql, tuple(values))
        r = cur.fetchone()
        conn.commit()

        return jsonify(
            {
                "message": "Análise de margem criada",
                "analise_margem": {
                    "id": r[0],
                    "user_id": r[1],
                    "produto_ou_servico": r[2],
                    "custo": str(r[3]) if r[3] is not None else None,
                    "hora_homem": str(r[4]) if r[4] is not None else None,
                    "imposto": str(r[5]) if r[5] is not None else None,
                    "margem_bruta": str(r[6]) if r[6] is not None else None,
                    "comissao": str(r[7]) if r[7] is not None else None,
                    "frete": str(r[8]) if r[8] is not None else None,
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
def list_analises_margem(
    current_user=None,
    user_id: int | None = None,
    page: int = 1,
    per_page: int = DEFAULT_PER_PAGE,
):
    # saneamento
    if not page or page < 1:
        page = 1

    # trava per_page em 10/50/100
    if per_page not in ALLOWED_PER_PAGE:
        per_page = DEFAULT_PER_PAGE

    offset = (page - 1) * per_page

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        where_sql = ""
        params = []
        if user_id:
            where_sql = " WHERE user_id = %s"
            params.append(user_id)

        # total
        cur.execute(
            f"SELECT COUNT(1) FROM public.analise_margem{where_sql};",
            tuple(params),
        )
        total_items = cur.fetchone()[0] or 0
        total_pages = ceil(total_items / per_page) if total_items else 0

        # dados paginados
        sql = f"""
            SELECT
                id, user_id, produto_ou_servico, custo, hora_homem,
                imposto, margem_bruta, comissao, frete
            FROM public.analise_margem
            {where_sql}
            ORDER BY id ASC
            LIMIT %s OFFSET %s;
        """

        params_data = params + [per_page, offset]
        cur.execute(sql, tuple(params_data))
        rows = cur.fetchall()

        data = []
        for r in rows:
            data.append(
                {
                    "id": r[0],
                    "user_id": r[1],
                    "produto_ou_servico": r[2],
                    "custo": str(r[3]) if r[3] is not None else None,
                    "hora_homem": str(r[4]) if r[4] is not None else None,
                    "imposto": str(r[5]) if r[5] is not None else None,
                    "margem_bruta": str(r[6]) if r[6] is not None else None,
                    "comissao": str(r[7]) if r[7] is not None else None,
                    "frete": str(r[8]) if r[8] is not None else None,
                }
            )

        return jsonify(
            {
                "pagination": {
                    "items_on_page": len(data),
                    "page": page,
                    "per_page": per_page,
                    "total_items": total_items,
                    "total_pages": total_pages,
                },
                "analises_margem": data,
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "list failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# GET
# =========================
def get_analise_margem(current_user=None, margem_id: int = 0):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id, user_id, produto_ou_servico, custo, hora_homem,
                imposto, margem_bruta, comissao, frete
            FROM public.analise_margem
            WHERE id = %s
            LIMIT 1;
            """,
            (margem_id,),
        )

        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Registro não encontrado"}), 404

        return jsonify(
            {
                "analise_margem": {
                    "id": r[0],
                    "user_id": r[1],
                    "produto_ou_servico": r[2],
                    "custo": str(r[3]) if r[3] else None,
                    "hora_homem": str(r[4]) if r[4] else None,
                    "imposto": str(r[5]) if r[5] else None,
                    "margem_bruta": str(r[6]) if r[6] else None,
                    "comissao": str(r[7]) if r[7] else None,
                    "frete": str(r[8]) if r[8] else None,
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
def update_analise_margem(current_user=None, margem_id: int = 0):
    data = request.get_json(silent=True) or {}
    payload = {k: data[k] for k in data.keys() if k in FIELDS}

    if not payload:
        return jsonify({"error": "No valid fields to update"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if "user_id" in payload:
            if not _customer_id_exists(cur, payload["user_id"]):
                return jsonify(
                    {
                        "error": "Invalid user_id",
                        "details": "user_id must exist in public.clientes.id",
                    }
                ), 400

        _try_calc_margem_bruta(payload)

        set_parts = []
        values = []

        for k, v in payload.items():
            set_parts.append(f"{k} = %s")
            values.append(v)

        values.append(margem_id)

        cur.execute(
            f"""
            UPDATE public.analise_margem
            SET {", ".join(set_parts)}
            WHERE id = %s;
            """,
            tuple(values),
        )

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Registro não encontrado"}), 404

        conn.commit()
        return jsonify({"message": "Análise de margem atualizada"}), 200

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
def delete_analise_margem(current_user=None, margem_id: int = 0):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM public.analise_margem WHERE id = %s;", (margem_id,))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Registro não encontrado"}), 404

        conn.commit()
        return jsonify({"message": "Análise de margem removida"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "delete failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()
