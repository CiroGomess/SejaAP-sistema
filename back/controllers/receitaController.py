# receitaController.py

from decimal import Decimal, InvalidOperation
from flask import request, jsonify
from config.db import get_connection
from math import ceil
from datetime import datetime
from utils.helpers import generate_secure_id


# Campos aceitos pelo INSERT/UPDATE via API
FIELDS = {
    "user_id",
    "numero_orcamento",
    "nome_cliente",
    "data_emissao",
    "data_vencimento",
    "produto_ou_servico",
    "nome_produto_ou_servico",
    "quantidade",
    "valor_unitario",
    "valor_total",
    "unidade_filial",
    "projeto",
    "centro_de_resultado",
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
    """
    Se valor_total não vier, mas quantidade e valor_unitario vierem,
    calcula valor_total automaticamente.
    """
    if payload.get("valor_total") is not None:
        return

    q = payload.get("quantidade")
    vu = payload.get("valor_unitario")

    if q is None or vu is None:
        return

    try:
        payload["valor_total"] = (Decimal(str(q)) * Decimal(str(vu))).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        pass


# =========================
# CREATE
# =========================
def create_receita(current_user=None):
    data = request.get_json(silent=True) or {}

    required = ["user_id"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    payload = {k: data.get(k) for k in FIELDS if k in data}

    payload["user_id"] = str(payload["user_id"]).strip()
    if not payload["user_id"]:
        return jsonify({"error": "Invalid user_id"}), 400

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
            INSERT INTO public.receita_user ({", ".join(columns)})
            VALUES ({placeholders})
            RETURNING
                id, user_id, numero_orcamento, nome_cliente,
                data_emissao, data_vencimento,
                produto_ou_servico, nome_produto_ou_servico,
                quantidade, valor_unitario, valor_total,
                unidade_filial, projeto, centro_de_resultado;
        """

        cur.execute(sql, tuple(values))
        r = cur.fetchone()
        conn.commit()

        return jsonify(
            {
                "message": "Receita created",
                "receita": {
                    "id": r[0],
                    "user_id": r[1],
                    "numero_orcamento": r[2],
                    "nome_cliente": r[3],
                    "data_emissao": str(r[4]) if r[4] else None,
                    "data_vencimento": str(r[5]) if r[5] else None,
                    "produto_ou_servico": r[6],
                    "nome_produto_ou_servico": r[7],
                    "quantidade": str(r[8]) if r[8] is not None else None,
                    "valor_unitario": str(r[9]) if r[9] is not None else None,
                    "valor_total": str(r[10]) if r[10] is not None else None,
                    "unidade_filial": r[11],
                    "projeto": r[12],
                    "centro_de_resultado": r[13],
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
def list_receitas(
    current_user=None,
    user_id: str | None = None,
    page: int = 1,
    per_page: int = 10,
):
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

        where_sql = ""
        params_where = []

        if user_id is not None and str(user_id).strip():
            where_sql = " WHERE user_id = %s"
            params_where.append(str(user_id).strip())

        # TOTAL de registros
        cur.execute(
            f"SELECT COUNT(*) FROM public.receita_user{where_sql};",
            tuple(params_where),
        )
        total_items = cur.fetchone()[0] or 0
        total_pages = ceil(total_items / per_page) if total_items > 0 else 0

        stats = {
            "mes_maior_faturamento": None,
            "mes_menor_faturamento": None,
        }

        if total_items > 0:
            cur.execute(
                f"""
                WITH mensal AS (
                    SELECT
                        to_char(date_trunc('month', data_emissao), 'YYYY-MM') AS mes,
                        SUM(COALESCE(valor_total, 0))::numeric(18,2) AS faturamento
                    FROM public.receita_user
                    {where_sql}
                    GROUP BY 1
                )
                SELECT
                    (SELECT row_to_json(t) FROM (
                        SELECT mes, faturamento
                        FROM mensal
                        ORDER BY faturamento DESC, mes DESC
                        LIMIT 1
                    ) t) AS maior,
                    (SELECT row_to_json(t) FROM (
                        SELECT mes, faturamento
                        FROM mensal
                        ORDER BY faturamento ASC, mes ASC
                        LIMIT 1
                    ) t) AS menor;
                """,
                tuple(params_where),
            )
            row_stats = cur.fetchone()
            if row_stats:
                maior = row_stats[0]
                menor = row_stats[1]

                if isinstance(maior, dict):
                    stats["mes_maior_faturamento"] = {
                        "mes": maior.get("mes"),
                        "faturamento": float(maior.get("faturamento") or 0),
                    }
                elif maior is not None:
                    try:
                        stats["mes_maior_faturamento"] = {
                            "mes": maior["mes"],
                            "faturamento": float(maior["faturamento"] or 0),
                        }
                    except Exception:
                        stats["mes_maior_faturamento"] = None

                if isinstance(menor, dict):
                    stats["mes_menor_faturamento"] = {
                        "mes": menor.get("mes"),
                        "faturamento": float(menor.get("faturamento") or 0),
                    }
                elif menor is not None:
                    try:
                        stats["mes_menor_faturamento"] = {
                            "mes": menor["mes"],
                            "faturamento": float(menor["faturamento"] or 0),
                        }
                    except Exception:
                        stats["mes_menor_faturamento"] = None

        if total_pages > 0 and page > total_pages:
            return jsonify(
                {
                    "receitas": [],
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "items_on_page": 0,
                        "total_items": total_items,
                        "total_pages": total_pages,
                    },
                    "stats": stats,
                }
            ), 200

        sql = f"""
            SELECT
                id, user_id, numero_orcamento, nome_cliente,
                data_emissao, data_vencimento,
                produto_ou_servico, nome_produto_ou_servico,
                quantidade, valor_unitario, valor_total,
                unidade_filial, projeto, centro_de_resultado
            FROM public.receita_user
            {where_sql}
            ORDER BY id ASC
            LIMIT %s OFFSET %s;
        """

        params = params_where + [per_page, offset]
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

        receitas = []
        for r in rows:
            receitas.append(
                {
                    "id": r[0],
                    "user_id": r[1],
                    "numero_orcamento": r[2],
                    "nome_cliente": r[3],
                    "data_emissao": str(r[4]) if r[4] else None,
                    "data_vencimento": str(r[5]) if r[5] else None,
                    "produto_ou_servico": r[6],
                    "nome_produto_ou_servico": r[7],
                    "quantidade": str(r[8]) if r[8] is not None else None,
                    "valor_unitario": str(r[9]) if r[9] is not None else None,
                    "valor_total": str(r[10]) if r[10] is not None else None,
                    "unidade_filial": r[11],
                    "projeto": r[12],
                    "centro_de_resultado": r[13],
                }
            )

        return jsonify(
            {
                "receitas": receitas,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "items_on_page": len(receitas),
                    "total_items": total_items,
                    "total_pages": total_pages,
                },
                "stats": stats,
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "list failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# GET BY ID
# =========================
def get_receita(current_user=None, receita_id: str = ""):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id, user_id, numero_orcamento, nome_cliente,
                data_emissao, data_vencimento,
                produto_ou_servico, nome_produto_ou_servico,
                quantidade, valor_unitario, valor_total,
                unidade_filial, projeto, centro_de_resultado
            FROM public.receita_user
            WHERE id = %s
            LIMIT 1;
            """,
            (receita_id,),
        )

        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Receita not found"}), 404

        return jsonify(
            {
                "receita": {
                    "id": r[0],
                    "user_id": r[1],
                    "numero_orcamento": r[2],
                    "nome_cliente": r[3],
                    "data_emissao": str(r[4]) if r[4] else None,
                    "data_vencimento": str(r[5]) if r[5] else None,
                    "produto_ou_servico": r[6],
                    "nome_produto_ou_servico": r[7],
                    "quantidade": str(r[8]) if r[8] is not None else None,
                    "valor_unitario": str(r[9]) if r[9] is not None else None,
                    "valor_total": str(r[10]) if r[10] is not None else None,
                    "unidade_filial": r[11],
                    "projeto": r[12],
                    "centro_de_resultado": r[13],
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
def update_receita(current_user=None, receita_id: str = ""):
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

        need_recalc = ("valor_total" not in payload) and ("quantidade" in payload or "valor_unitario" in payload)

        if need_recalc:
            cur.execute(
                """
                SELECT quantidade, valor_unitario
                FROM public.receita_user
                WHERE id = %s;
                """,
                (receita_id,),
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Receita not found"}), 404

            q_old, vu_old = row
            q_new = payload.get("quantidade", q_old)
            vu_new = payload.get("valor_unitario", vu_old)

            try:
                payload["valor_total"] = (Decimal(str(q_new)) * Decimal(str(vu_new))).quantize(Decimal("0.01"))
            except (InvalidOperation, ValueError, TypeError):
                pass

        set_parts = []
        values = []

        for k, v in payload.items():
            set_parts.append(f"{k} = %s")
            values.append(v)

        values.append(receita_id)

        cur.execute(
            f"""
            UPDATE public.receita_user
            SET {", ".join(set_parts)}
            WHERE id = %s;
            """,
            tuple(values),
        )

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Receita not found"}), 404

        conn.commit()
        return jsonify({"message": "Receita updated"}), 200

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
def delete_receita(current_user=None, receita_id: str = ""):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM public.receita_user WHERE id = %s;", (receita_id,))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Receita not found"}), 404

        conn.commit()
        return jsonify({"message": "Receita deleted"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "delete failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def receita_evolutiva(current_user=None, user_id: str = "", ano: int = 0):
    user_id = str(user_id).strip()
    if not user_id:
        return jsonify({"error": "Invalid user_id"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                EXTRACT(MONTH FROM data_emissao)::int AS mes,
                SUM(COALESCE(valor_total, 0))::numeric(18,2) AS total
            FROM public.receita_user
            WHERE user_id = %s
              AND EXTRACT(YEAR FROM data_emissao) = %s
            GROUP BY mes
            ORDER BY mes;
            """,
            (user_id, ano),
        )

        rows = cur.fetchall()

        receitas = []
        for r in rows:
            receitas.append(
                {
                    "mes": r[0],
                    "valor_total": float(r[1]),
                }
            )

        maior_mes = None
        menor_mes = None

        if receitas:
            maior_mes = max(receitas, key=lambda x: x["valor_total"])
            menor_mes = min(receitas, key=lambda x: x["valor_total"])

        return jsonify(
            {
                "user_id": user_id,
                "ano": ano,
                "receita_evolutiva": receitas,
                "destaques": {
                    "mes_maior_faturamento": maior_mes,
                    "mes_menor_faturamento": menor_mes,
                },
            }
        ), 200

    except Exception as e:
        return jsonify(
            {"error": "receita evolutiva failed", "details": str(e)}
        ), 500
    finally:
        if conn:
            conn.close()