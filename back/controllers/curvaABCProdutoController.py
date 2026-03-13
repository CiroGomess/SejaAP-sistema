from flask import request, jsonify
from config.db import get_connection
from math import ceil
from decimal import Decimal, InvalidOperation
from datetime import datetime


# ==============================================================================
# HELPERS
# ==============================================================================

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


def _classifica_abc(cum_pct_0_1: Decimal, a_limit=Decimal("0.80"), b_limit=Decimal("0.95")) -> str:
    """
    cum_pct_0_1: 0.00 -> 1.00 (percentual acumulado como fração)
    """
    if cum_pct_0_1 <= a_limit:
        return "A"
    if cum_pct_0_1 <= b_limit:
        return "B"
    return "C"


def _dec(v, fallback="0") -> Decimal:
    try:
        if v is None:
            return Decimal(fallback)
        return Decimal(str(v))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(fallback)


def _fmt_money(d: Decimal) -> str:
    return str(d.quantize(Decimal("0.01")))


def _fmt_qty(d: Decimal) -> str:
    return str(d.quantize(Decimal("0.001")))


def _fmt_pct(d: Decimal) -> str:
    return str(d.quantize(Decimal("0.01")))


# ==============================================================================
# CONTROLLER
# ==============================================================================
def list_curva_abc_produtos(
    current_user=None,
    user_id: str | None = None,
    page: int = 1,
    per_page: int = 10,
    date_from: str | None = None,
    date_to: str | None = None,
    q: str | None = None,
    a_limit: float = 0.80,
    b_limit: float = 0.95,
    year_a: int = 2024,
    year_b: int = 2025,
    tipo: str = "cliente",
):
    """
    Curva ABC com comparação anual.
    - tipo=cliente -> comportamento ORIGINAL (produto + cliente)
    - tipo=produto -> AGRUPA apenas por produto (SEM duplicar)
    """

    allowed_per_page = {10, 50, 100}
    if per_page not in allowed_per_page:
        return jsonify({"error": "Invalid per_page. Allowed: 10, 50, 100"}), 400

    if page < 1:
        page = 1

    offset = (page - 1) * per_page

    user_id = str(user_id).strip() if user_id is not None else ""
    if not user_id:
        return jsonify({"error": "Missing or invalid user_id"}), 400

    tipo = (tipo or "cliente").lower()
    if tipo not in ("produto", "cliente"):
        return jsonify({"error": "Invalid tipo. Use produto ou cliente"}), 400

    # -----------------------------
    # LIMITES ABC
    # -----------------------------
    try:
        a_limit_dec = Decimal(str(a_limit))
        b_limit_dec = Decimal(str(b_limit))
    except Exception:
        a_limit_dec = Decimal("0.80")
        b_limit_dec = Decimal("0.95")

    if a_limit_dec <= 0 or a_limit_dec >= 1:
        a_limit_dec = Decimal("0.80")
    if b_limit_dec <= a_limit_dec or b_limit_dec > 1:
        b_limit_dec = Decimal("0.95")

    # -----------------------------
    # ANOS
    # -----------------------------
    year_a = request.args.get("year_a", default=year_a, type=int)
    year_b = request.args.get("year_b", default=year_b, type=int)

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return jsonify(
                {"error": "Invalid user_id", "details": "user_id must exist in clientes"}
            ), 400

        # -----------------------------
        # WHERE
        # -----------------------------
        where_parts = ["user_id = %s"]
        params = [user_id]

        if date_from:
            where_parts.append("data_emissao >= %s")
            params.append(date_from)

        if date_to:
            where_parts.append("data_emissao <= %s")
            params.append(date_to)

        if q and q.strip():
            where_parts.append("LOWER(nome_produto_ou_servico) LIKE %s")
            params.append(f"%{q.lower()}%")

        where_sql = " WHERE " + " AND ".join(where_parts)

        # -----------------------------
        # GROUP BY DINAMICO
        # -----------------------------
        if tipo == "produto":
            group_fields = "produto_ou_servico, nome_produto_ou_servico"
            select_cliente = "NULL::text AS nome_cliente"
        else:
            group_fields = "produto_ou_servico, nome_produto_ou_servico, nome_cliente"
            select_cliente = "nome_cliente"

        # -----------------------------
        # TOTAL ITENS
        # -----------------------------
        cur.execute(
            f"""
            SELECT COUNT(*)
            FROM (
              SELECT 1
              FROM public.receita_user
              {where_sql}
              GROUP BY {group_fields}
            ) t;
            """,
            tuple(params),
        )

        total_items = cur.fetchone()[0] or 0
        total_pages = ceil(total_items / per_page) if total_items else 0

        # -----------------------------
        # QUERY PRINCIPAL
        # -----------------------------
        cur.execute(
            f"""
            WITH agg AS (
              SELECT
                produto_ou_servico,
                nome_produto_ou_servico,
                {select_cliente},

                COALESCE(SUM(valor_total), 0) AS total_valor,

                COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN quantidade ELSE 0 END), 0) AS qtd_a,
                COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN quantidade ELSE 0 END), 0) AS qtd_b,

                COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN valor_total ELSE 0 END), 0) AS val_a,
                COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN valor_total ELSE 0 END), 0) AS val_b

              FROM public.receita_user
              {where_sql}
              GROUP BY {group_fields}
            ),
            ranked AS (
              SELECT
                ROW_NUMBER() OVER (ORDER BY total_valor DESC) AS rank,
                *,
                SUM(total_valor) OVER () AS total_geral,
                SUM(total_valor) OVER (
                  ORDER BY total_valor DESC
                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) AS cum_total
              FROM agg
            )
            SELECT *
            FROM ranked
            ORDER BY rank
            LIMIT %s OFFSET %s;
            """,
            tuple([year_a, year_b, year_a, year_b] + params + [per_page, offset]),
        )

        rows = cur.fetchall()

        if not rows:
            return jsonify(
                {
                    "items": [],
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "items_on_page": 0,
                        "total_items": total_items,
                        "total_pages": total_pages,
                    },
                    "summary": {
                        "user_id": user_id,
                        "tipo": tipo,
                        "year_a": year_a,
                        "year_b": year_b,
                        "total_valor": "0.00",
                        "a_limit": str(a_limit_dec),
                        "b_limit": str(b_limit_dec),
                    },
                }
            ), 200

        total_geral_dec = _dec(rows[0][-2])

        items = []
        for r in rows:
            total_valor_dec = _dec(r[4])
            cum_total_dec = _dec(r[-1])

            pct = (total_valor_dec / total_geral_dec) if total_geral_dec > 0 else Decimal("0")
            pct_acum = (cum_total_dec / total_geral_dec) if total_geral_dec > 0 else Decimal("0")

            qtd_a_d = _dec(r[5])
            qtd_b_d = _dec(r[6])
            val_a_d = _dec(r[7])
            val_b_d = _dec(r[8])

            delta_qtd = qtd_b_d - qtd_a_d

            ticket_a = (val_a_d / qtd_a_d) if qtd_a_d > 0 else Decimal("0")
            ticket_b = (val_b_d / qtd_b_d) if qtd_b_d > 0 else Decimal("0")

            delta_ticket_pct = (
                ((ticket_b - ticket_a) / ticket_a) * Decimal("100")
                if ticket_a > 0 else None
            )

            items.append(
                {
                    "rank": int(r[0]),
                    "produto_ou_servico": r[1],
                    "nome_produto_ou_servico": r[2],
                    "nome_cliente": r[3],
                    "total_valor": _fmt_money(total_valor_dec),
                    "pct": _fmt_pct(pct * 100),
                    "pct_acumulado": _fmt_pct(pct_acum * 100),
                    "classe": _classifica_abc(pct_acum, a_limit_dec, b_limit_dec),
                    f"qtd_{year_a}": _fmt_qty(qtd_a_d),
                    f"qtd_{year_b}": _fmt_qty(qtd_b_d),
                    "delta_qtd": _fmt_qty(delta_qtd),
                    f"ticket_{year_a}": _fmt_money(ticket_a),
                    f"ticket_{year_b}": _fmt_money(ticket_b),
                    "delta_ticket_pct": _fmt_pct(delta_ticket_pct) if delta_ticket_pct is not None else None,
                }
            )

        return jsonify(
            {
                "items": items,
                "summary": {
                    "user_id": user_id,
                    "tipo": tipo,
                    "year_a": year_a,
                    "year_b": year_b,
                    "total_valor": _fmt_money(total_geral_dec),
                    "a_limit": str(a_limit_dec),
                    "b_limit": str(b_limit_dec),
                },
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "items_on_page": len(items),
                    "total_items": total_items,
                    "total_pages": total_pages,
                },
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "list curva abc failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def get_curva_abc_summary(current_user=None, user_id: str | None = None, year: int | None = None):
    user_id = str(user_id).strip() if user_id is not None else ""

    if not user_id:
        return jsonify({"error": "Missing or invalid user_id"}), 400

    if not year:
        year = datetime.now().year

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return jsonify(
                {"error": "Invalid user_id", "details": "user_id must exist in clientes"}
            ), 400

        # 1. Buscar anos disponíveis
        cur.execute(
            """
            SELECT DISTINCT EXTRACT(YEAR FROM data_emissao)::int as ano
            FROM public.receita_user
            WHERE user_id = %s
            ORDER BY ano DESC
            """,
            (user_id,),
        )
        available_years = [row[0] for row in cur.fetchall() if row[0] is not None]

        # 2. Query principal
        cur.execute(
            """
            WITH faturamento_por_produto AS (
                SELECT
                    nome_produto_ou_servico,
                    SUM(valor_total) as total_prod
                FROM public.receita_user
                WHERE user_id = %s
                  AND EXTRACT(YEAR FROM data_emissao) = %s
                GROUP BY nome_produto_ou_servico
            ),
            calculo_curva AS (
                SELECT
                    total_prod,
                    SUM(total_prod) OVER() as total_geral,
                    SUM(total_prod) OVER(
                        ORDER BY total_prod DESC
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) / NULLIF(SUM(total_prod) OVER(), 0) as pct_acumulado
                FROM faturamento_por_produto
            ),
            classificacao AS (
                SELECT
                    total_prod,
                    total_geral,
                    CASE
                        WHEN pct_acumulado <= 0.80 THEN 'A'
                        WHEN pct_acumulado <= 0.95 THEN 'B'
                        ELSE 'C'
                    END as classe
                FROM calculo_curva
            )
            SELECT
                COALESCE(MAX(total_geral), 0) as faturamento_total,
                COUNT(CASE WHEN classe = 'A' THEN 1 END) as qtd_a,
                COUNT(CASE WHEN classe = 'B' THEN 1 END) as qtd_b,
                COUNT(CASE WHEN classe = 'C' THEN 1 END) as qtd_c
            FROM classificacao
            """,
            (user_id, year),
        )

        row = cur.fetchone()

        if row and row[0] > 0:
            resumo = {
                "faturamento_total": _fmt_money(_dec(row[0])),
                "qtd_produtos_a": int(row[1]),
                "qtd_produtos_b": int(row[2]),
                "qtd_produtos_c": int(row[3]),
            }
        else:
            resumo = {
                "faturamento_total": "0.00",
                "qtd_produtos_a": 0,
                "qtd_produtos_b": 0,
                "qtd_produtos_c": 0,
            }

        return jsonify(
            {
                "available_years": available_years,
                "selected_year": year,
                "summary": resumo,
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "Summary failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()