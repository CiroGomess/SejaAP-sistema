from flask import request, jsonify
from config.db import get_connection
from math import ceil
from decimal import Decimal, InvalidOperation

# ==============================================================================
# HELPERS
# ==============================================================================

def _dec(v, fallback="0"):
    try:
        if v is None:
            return Decimal(fallback)
        return Decimal(str(v))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(fallback)


def _fmt_money(d: Decimal) -> str:
    return str(d.quantize(Decimal("0.01")))


def _fmt_qty(d: Decimal) -> str:
    # sua quantidade é numeric(14,3)
    return str(d.quantize(Decimal("0.001")))


def _fmt_pct(d: Decimal) -> str:
    return str(d.quantize(Decimal("0.01")))

# ==============================================================================
# CONTROLLER
# ==============================================================================

def list_ticket_medio_produtos(
    current_user=None,
    user_id: int | None = None,
    page: int = 1,
    per_page: int = 10,
    # filtros
    date_from: str | None = None,  # "YYYY-MM-DD"
    date_to: str | None = None,    # "YYYY-MM-DD"
    q: str | None = None,          # busca textual
    # anos comparados
    year_a: int = 2024,
    year_b: int = 2025,
):
    """
    Retorna Ticket Médio por produto/serviço.
    AJUSTE: Busca IPCA do cliente (clientes) para cálculo de ganho real.
    """

    # ---- valida paginação
    allowed_per_page = {10, 50, 100}
    if per_page not in allowed_per_page:
        return jsonify({"error": "Invalid per_page. Allowed: 10, 50, 100"}), 400
    if page < 1:
        page = 1
    offset = (page - 1) * per_page

    # ---- user_id obrigatório
    if user_id is None:
        user_id = request.args.get("user_id", type=int)

    if not user_id or user_id <= 0:
        return jsonify({"error": "Missing or invalid user_id"}), 400

    # ---- filtros opcionais
    if date_from is None:
        date_from = request.args.get("date_from") or None
    if date_to is None:
        date_to = request.args.get("date_to") or None
    if q is None:
        q = request.args.get("q") or None

    # ---- anos (querystring sobrescreve)
    year_a = request.args.get("year_a", default=year_a, type=int)
    year_b = request.args.get("year_b", default=year_b, type=int)

    if not year_a or not year_b or year_a <= 1900 or year_b <= 1900:
        return jsonify({"error": "Invalid years. Use year_a and year_b (e.g. 2024/2025)."}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # ------------------------------------------------------------------
        # 1. VALIDA USER E BUSCA O IPCA (AJUSTE SOLICITADO)
        # ------------------------------------------------------------------
        cur.execute(
            """
            SELECT IPCA
            FROM public.clientes
            WHERE id = %s
            LIMIT 1;
            """,
            (user_id,),
        )
        row_cust = cur.fetchone()

        if not row_cust:
            return jsonify(
                {
                    "error": "Invalid user_id",
                    "details": "user_id must exist in public.clientes.id",
                }
            ), 400
        
        # Recupera o valor do IPCA (pode ser NULL no banco)
        val_ipca_raw = row_cust[0]
        customer_ipca_dec = _dec(val_ipca_raw, "0") # Converte para Decimal (0 se for None)

        # ------------------------------------------------------------------
        # 2. WHERE DINÂMICO
        # ------------------------------------------------------------------
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
            params.append(f"%{q.strip().lower()}%")

        where_sql = " WHERE " + " AND ".join(where_parts)

        # ------------------------------------------------------------------
        # 3. CONTA TOTAL DE ITENS (PAGINAÇÃO)
        # ------------------------------------------------------------------
        cur.execute(
            f"""
            SELECT COUNT(*)
            FROM (
              SELECT 1
              FROM public.receita_user
              {where_sql}
              GROUP BY produto_ou_servico, nome_produto_ou_servico
            ) t;
            """,
            tuple(params),
        )
        total_items = cur.fetchone()[0] or 0
        total_pages = ceil(total_items / per_page) if total_items > 0 else 0

        # Se página estourar limite, retorna vazio mas com o summary preenchido
        if total_pages > 0 and page > total_pages:
            return jsonify(
                {
                    "items": [],
                    "summary": {
                        "user_id": user_id,
                        "customer_ipca": _fmt_pct(customer_ipca_dec), # Envia o IPCA mesmo sem itens
                        "year_a": year_a,
                        "year_b": year_b,
                        "date_from": date_from,
                        "date_to": date_to,
                        "q": q,
                    },
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "items_on_page": 0,
                        "total_items": total_items,
                        "total_pages": total_pages,
                    },
                }
            ), 200

        # ------------------------------------------------------------------
        # 4. BUSCA DADOS AGREGADOS
        # ------------------------------------------------------------------
        cur.execute(
            f"""
            SELECT
              produto_ou_servico,
              nome_produto_ou_servico,

              COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN quantidade ELSE 0 END), 0) AS qtd_a,
              COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN quantidade ELSE 0 END), 0) AS qtd_b,

              COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN valor_total ELSE 0 END), 0) AS val_a,
              COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN valor_total ELSE 0 END), 0) AS val_b
            FROM public.receita_user
            {where_sql}
            GROUP BY produto_ou_servico, nome_produto_ou_servico
            ORDER BY nome_produto_ou_servico ASC
            LIMIT %s OFFSET %s;
            """,
            tuple([year_a, year_b, year_a, year_b] + params + [per_page, offset]),
        )
        rows = cur.fetchall()

        items = []
        for idx, r in enumerate(rows):
            produto_ou_servico, nome_produto_ou_servico, qtd_a, qtd_b, val_a, val_b = r

            qtd_a_d = _dec(qtd_a)
            qtd_b_d = _dec(qtd_b)
            val_a_d = _dec(val_a)
            val_b_d = _dec(val_b)

            # --- Ticket Médio ---
            ticket_a = Decimal("0")
            ticket_b = Decimal("0")

            if qtd_a_d > 0:
                ticket_a = (val_a_d / qtd_a_d)
            if qtd_b_d > 0:
                ticket_b = (val_b_d / qtd_b_d)

            # --- Variações ---
            delta_qtd = (qtd_b_d - qtd_a_d)

            # Variação Nominal (%)
            delta_ticket_pct = None
            if ticket_a > 0:
                delta_ticket_pct = ((ticket_b - ticket_a) / ticket_a) * Decimal("100")

            # Variação Real (%) = Nominal - IPCA
            ipca_delta_pct = None
            if delta_ticket_pct is not None:
                ipca_delta_pct = delta_ticket_pct - customer_ipca_dec

            items.append(
                {
                    "rank": offset + idx + 1,
                    "produto_ou_servico": produto_ou_servico,
                    "nome_produto_ou_servico": nome_produto_ou_servico,

                    f"qtd_{year_a}": _fmt_qty(qtd_a_d),
                    f"qtd_{year_b}": _fmt_qty(qtd_b_d),
                    "delta_qtd": _fmt_qty(delta_qtd),

                    f"ticket_{year_a}": _fmt_money(ticket_a),
                    f"ticket_{year_b}": _fmt_money(ticket_b),

                    "delta_ticket_pct": _fmt_pct(delta_ticket_pct) if delta_ticket_pct is not None else None,
                    
                    # Envia o Ganho Real calculado com o IPCA do cliente
                    "ipca_delta_pct": _fmt_pct(ipca_delta_pct) if ipca_delta_pct is not None else None,
                }
            )

        return jsonify(
            {
                "items": items,
                "summary": {
                    "user_id": user_id,
                    "customer_ipca": _fmt_pct(customer_ipca_dec), # <--- IPCA NO JSON
                    "year_a": year_a,
                    "year_b": year_b,
                    "date_from": date_from,
                    "date_to": date_to,
                    "q": q,
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
        return jsonify({"error": "list ticket medio failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()