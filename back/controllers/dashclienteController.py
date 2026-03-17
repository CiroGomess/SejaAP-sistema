from datetime import datetime
from decimal import Decimal, InvalidOperation
from flask import jsonify
from config.db import get_connection


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


def _fmt_int(v) -> int:
    try:
        return int(v or 0)
    except Exception:
        return 0


def _fmt_pct(d: Decimal | None) -> str | None:
    if d is None:
        return None
    return str(d.quantize(Decimal("0.01")))


def _fmt_qty(d: Decimal) -> str:
    return str(d.quantize(Decimal("0.001")))


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


def _build_month_map(rows):
    month_map = {i: Decimal("0") for i in range(1, 13)}
    for mes, valor in rows:
        month_map[int(mes)] = _dec(valor)
    return month_map


def _classifica_abc(
    cum_pct_0_1: Decimal,
    a_limit=Decimal("0.80"),
    b_limit=Decimal("0.95"),
) -> str:
    if cum_pct_0_1 <= a_limit:
        return "A"
    if cum_pct_0_1 <= b_limit:
        return "B"
    return "C"


# ==============================================================================
# CONTROLLER
# ==============================================================================

def get_dash_cliente(current_user=None, user_id: str = "", year: int | None = None):
    user_id = str(user_id).strip()
    if not user_id:
        return jsonify({"error": "Invalid user_id"}), 400

    conn = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        # --------------------------------------------------
        # Valida cliente
        # --------------------------------------------------
        if not _customer_id_exists(cur, user_id):
            return jsonify(
                {
                    "error": "Invalid user_id",
                    "details": "user_id must exist in public.clientes.id",
                }
            ), 400

        # --------------------------------------------------
        # Anos disponíveis
        # --------------------------------------------------
        cur.execute(
            """
            SELECT DISTINCT EXTRACT(YEAR FROM data_emissao)::int AS ano
            FROM public.receita_user
            WHERE user_id = %s
              AND data_emissao IS NOT NULL
            ORDER BY ano DESC;
            """,
            (user_id,),
        )

        year_rows = cur.fetchall()
        available_years = [r[0] for r in year_rows if r[0] is not None]

        current_year = datetime.now().year
        selected_year = int(year) if year is not None else current_year

        if not available_years:
            available_years = [selected_year]

        # --------------------------------------------------
        # Resumo do ano selecionado
        # --------------------------------------------------
        cur.execute(
            """
            SELECT
                COALESCE(SUM(valor_total), 0) AS faturamento_total,
                COUNT(DISTINCT numero_orcamento) AS total_vendas,
                COUNT(DISTINCT nome_produto_ou_servico) AS total_produtos_servicos
            FROM public.receita_user
            WHERE user_id = %s
              AND EXTRACT(YEAR FROM data_emissao) = %s;
            """,
            (user_id, selected_year),
        )

        resumo = cur.fetchone()

        faturamento_total = _dec(resumo[0])
        total_vendas = _fmt_int(resumo[1])
        total_produtos_servicos = _fmt_int(resumo[2])

        ticket_medio = Decimal("0")

        if total_vendas > 0:
            ticket_medio = faturamento_total / Decimal(str(total_vendas))

        # --------------------------------------------------
        # Faturamento do ano anterior
        # --------------------------------------------------
        cur.execute(
            """
            SELECT
                COALESCE(SUM(valor_total), 0) AS faturamento_total
            FROM public.receita_user
            WHERE user_id = %s
              AND EXTRACT(YEAR FROM data_emissao) = %s;
            """,
            (user_id, selected_year - 1),
        )

        row_prev = cur.fetchone()
        faturamento_anterior = _dec(row_prev[0])

        crescimento_anual = None
        if faturamento_anterior > 0:
            crescimento_anual = (
                ((faturamento_total - faturamento_anterior) / faturamento_anterior)
                * Decimal("100")
            )

        # --------------------------------------------------
        # Evolução mensal
        # --------------------------------------------------
        cur.execute(
            """
            SELECT
                EXTRACT(MONTH FROM data_emissao)::int AS mes,
                COALESCE(SUM(valor_total), 0) AS total
            FROM public.receita_user
            WHERE user_id = %s
              AND EXTRACT(YEAR FROM data_emissao) = %s
            GROUP BY mes
            ORDER BY mes;
            """,
            (user_id, selected_year),
        )

        rows_mensais = cur.fetchall()
        month_map = _build_month_map(rows_mensais)

        receita_evolutiva = []
        for mes in range(1, 13):
            receita_evolutiva.append(
                {
                    "mes": mes,
                    "valor_total": _fmt_money(month_map[mes]),
                }
            )

        media_mensal = Decimal("0")
        if faturamento_total > 0:
            media_mensal = faturamento_total / Decimal("12")

        meses_com_valor = []
        for mes in range(1, 13):
            valor_mes = month_map[mes]
            if valor_mes > 0:
                meses_com_valor.append(
                    {
                        "mes": mes,
                        "valor_total": valor_mes,
                    }
                )

        melhor_mes = None
        pior_mes = None

        if meses_com_valor:
            melhor_mes_raw = max(meses_com_valor, key=lambda x: x["valor_total"])
            pior_mes_raw = min(meses_com_valor, key=lambda x: x["valor_total"])

            melhor_mes = {
                "mes": melhor_mes_raw["mes"],
                "valor_total": _fmt_money(melhor_mes_raw["valor_total"]),
            }

            pior_mes = {
                "mes": pior_mes_raw["mes"],
                "valor_total": _fmt_money(pior_mes_raw["valor_total"]),
            }

        # --------------------------------------------------
        # Crescimento do período
        # --------------------------------------------------
        crescimento_periodo = None

        if meses_com_valor:
            primeiro_mes = meses_com_valor[0]
            ultimo_mes = meses_com_valor[-1]

            if primeiro_mes["valor_total"] > 0:
                crescimento_periodo = (
                    (
                        (ultimo_mes["valor_total"] - primeiro_mes["valor_total"])
                        / primeiro_mes["valor_total"]
                    )
                    * Decimal("100")
                )

        # ==================================================
        # BLOCO 1 - CURVA ABC (RESUMO PARA O DASH)
        # ==================================================
        cur.execute(
            """
            WITH faturamento_por_produto AS (
                SELECT
                    nome_produto_ou_servico,
                    SUM(valor_total) AS total_prod
                FROM public.receita_user
                WHERE user_id = %s
                  AND EXTRACT(YEAR FROM data_emissao) = %s
                GROUP BY nome_produto_ou_servico
            ),
            calculo_curva AS (
                SELECT
                    nome_produto_ou_servico,
                    total_prod,
                    SUM(total_prod) OVER() AS total_geral,
                    SUM(total_prod) OVER(
                        ORDER BY total_prod DESC
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) / NULLIF(SUM(total_prod) OVER(), 0) AS pct_acumulado
                FROM faturamento_por_produto
            ),
            classificacao AS (
                SELECT
                    nome_produto_ou_servico,
                    total_prod,
                    total_geral,
                    CASE
                        WHEN pct_acumulado <= 0.80 THEN 'A'
                        WHEN pct_acumulado <= 0.95 THEN 'B'
                        ELSE 'C'
                    END AS classe
                FROM calculo_curva
            )
            SELECT
                COALESCE(MAX(total_geral), 0) AS faturamento_total,
                COUNT(CASE WHEN classe = 'A' THEN 1 END) AS qtd_a,
                COUNT(CASE WHEN classe = 'B' THEN 1 END) AS qtd_b,
                COUNT(CASE WHEN classe = 'C' THEN 1 END) AS qtd_c,
                COALESCE(SUM(CASE WHEN classe = 'A' THEN total_prod ELSE 0 END), 0) AS valor_a,
                COALESCE(SUM(CASE WHEN classe = 'B' THEN total_prod ELSE 0 END), 0) AS valor_b,
                COALESCE(SUM(CASE WHEN classe = 'C' THEN total_prod ELSE 0 END), 0) AS valor_c
            FROM classificacao;
            """,
            (user_id, selected_year),
        )

        abc_row = cur.fetchone()

        abc_total = _dec(abc_row[0])
        qtd_a = _fmt_int(abc_row[1])
        qtd_b = _fmt_int(abc_row[2])
        qtd_c = _fmt_int(abc_row[3])

        valor_a = _dec(abc_row[4])
        valor_b = _dec(abc_row[5])
        valor_c = _dec(abc_row[6])

        pct_a = Decimal("0")
        pct_b = Decimal("0")
        pct_c = Decimal("0")

        if abc_total > 0:
            pct_a = (valor_a / abc_total) * Decimal("100")
            pct_b = (valor_b / abc_total) * Decimal("100")
            pct_c = (valor_c / abc_total) * Decimal("100")

        curva_abc = {
            "faturamento_total": _fmt_money(abc_total),
            "classes": {
                "A": {
                    "qtd_itens": qtd_a,
                    "valor_total": _fmt_money(valor_a),
                    "percentual_faturamento": _fmt_pct(pct_a),
                    "descricao": "Maior relevância",
                },
                "B": {
                    "qtd_itens": qtd_b,
                    "valor_total": _fmt_money(valor_b),
                    "percentual_faturamento": _fmt_pct(pct_b),
                    "descricao": "Relevância intermediária",
                },
                "C": {
                    "qtd_itens": qtd_c,
                    "valor_total": _fmt_money(valor_c),
                    "percentual_faturamento": _fmt_pct(pct_c),
                    "descricao": "Menor relevância",
                },
            },
            "grafico_donut": [
                {"classe": "A", "percentual": _fmt_pct(pct_a), "qtd_itens": qtd_a},
                {"classe": "B", "percentual": _fmt_pct(pct_b), "qtd_itens": qtd_b},
                {"classe": "C", "percentual": _fmt_pct(pct_c), "qtd_itens": qtd_c},
            ],
        }

        # ==================================================
        # BLOCO 2 - TICKET MÉDIO (TOP 5 PARA O DASH)
        # ==================================================
        cur.execute(
            """
            WITH base AS (
                SELECT
                    nome_produto_ou_servico,

                    COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN quantidade ELSE 0 END), 0) AS qtd_atual,
                    COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN quantidade ELSE 0 END), 0) AS qtd_anterior,

                    COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN valor_total ELSE 0 END), 0) AS val_atual,
                    COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM data_emissao)::int = %s THEN valor_total ELSE 0 END), 0) AS val_anterior
                FROM public.receita_user
                WHERE user_id = %s
                GROUP BY nome_produto_ou_servico
            )
            SELECT
                nome_produto_ou_servico,
                qtd_atual,
                qtd_anterior,
                val_atual,
                val_anterior
            FROM base
            WHERE qtd_atual > 0
            ORDER BY
                CASE
                    WHEN qtd_atual > 0 THEN val_atual / qtd_atual
                    ELSE 0
                END DESC,
                nome_produto_ou_servico ASC
            LIMIT 5;
            """,
            (selected_year, selected_year - 1, selected_year, selected_year - 1, user_id),
        )

        ticket_rows = cur.fetchall()

        top_ticket_items = []
        soma_ticket_top5 = Decimal("0")
        soma_var_pct = Decimal("0")
        qtd_var_validas = 0

        for idx, row in enumerate(ticket_rows, start=1):
            nome_produto = row[0]
            qtd_atual = _dec(row[1])
            qtd_anterior = _dec(row[2])
            val_atual = _dec(row[3])
            val_anterior = _dec(row[4])

            ticket_atual = (val_atual / qtd_atual) if qtd_atual > 0 else Decimal("0")
            ticket_anterior = (val_anterior / qtd_anterior) if qtd_anterior > 0 else Decimal("0")

            delta_pct_valor = None
            if val_anterior > 0:
                delta_pct_valor = ((val_atual - val_anterior) / val_anterior) * Decimal("100")
                soma_var_pct += delta_pct_valor
                qtd_var_validas += 1

            soma_ticket_top5 += ticket_atual

            top_ticket_items.append(
                {
                    "rank": idx,
                    "nome_produto_ou_servico": nome_produto,
                    "ticket_medio": _fmt_money(ticket_atual),
                    "ticket_medio_anterior": _fmt_money(ticket_anterior),
                    "variacao_percentual": _fmt_pct(delta_pct_valor) if delta_pct_valor is not None else "0.00",
                    "qtd_atual": _fmt_qty(qtd_atual),
                    "qtd_anterior": _fmt_qty(qtd_anterior),
                    "valor_atual": _fmt_money(val_atual),
                    "valor_anterior": _fmt_money(val_anterior),
                }
            )

        media_top5 = Decimal("0")
        if top_ticket_items:
            media_top5 = soma_ticket_top5 / Decimal(str(len(top_ticket_items)))

        variacao_media_top5 = None
        if qtd_var_validas > 0:
            variacao_media_top5 = soma_var_pct / Decimal(str(qtd_var_validas))

        ticket_medio_dashboard = {
            "media_top_5": _fmt_money(media_top5),
            "variacao_media_vs_ano_anterior": _fmt_pct(variacao_media_top5) if variacao_media_top5 is not None else "0.00",
            "top_5_produtos": top_ticket_items,
            "grafico_barras": [
                {
                    "label": item["nome_produto_ou_servico"],
                    "valor": item["ticket_medio"],
                    "variacao_percentual": item["variacao_percentual"],
                }
                for item in top_ticket_items
            ],
        }

        # ==================================================
        # BLOCO 3 - RESUMO CONTÁBIL
        # Apenas:
        # - Receitas Totais
        # - Despesas Totais
        # - Resultado Líquido
        # ==================================================
        cur.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN valor > 0 THEN valor ELSE 0 END), 0) AS receitas_totais,
                COALESCE(SUM(CASE WHEN valor < 0 THEN ABS(valor) ELSE 0 END), 0) AS despesas_totais,
                COALESCE(SUM(valor), 0) AS resultado_liquido
            FROM public.contabilidade_dados
            WHERE user_id = %s
              AND ano = %s;
            """,
            (user_id, selected_year),
        )

        contabil_row = cur.fetchone()

        receitas_totais = _dec(contabil_row[0])
        despesas_totais = _dec(contabil_row[1])
        resultado_liquido = _dec(contabil_row[2])

        resumo_contabil = {
            "receitas_totais": _fmt_money(receitas_totais),
            "despesas_totais": _fmt_money(despesas_totais),
            "resultado_liquido": _fmt_money(resultado_liquido),
        }

        # --------------------------------------------------
        # RESPOSTA FINAL
        # --------------------------------------------------
        return jsonify(
            {
                "user_id": user_id,
                "available_years": available_years,
                "selected_year": selected_year,
                "cards": {
                    "faturamento_total": _fmt_money(faturamento_total),
                    "ticket_medio": _fmt_money(ticket_medio),
                    "crescimento_anual": _fmt_pct(crescimento_anual),
                    "produtos_servicos": total_produtos_servicos,
                    "total_vendas": total_vendas,
                    "faturamento_anterior": _fmt_money(faturamento_anterior),
                },
                "grafico_receita": {
                    "media_mensal": _fmt_money(media_mensal),
                    "crescimento_periodo": _fmt_pct(crescimento_periodo),
                    "receita_evolutiva": receita_evolutiva,
                    "melhor_mes": melhor_mes,
                    "pior_mes": pior_mes,
                },
                "curva_abc": curva_abc,
                "ticket_medio_dashboard": ticket_medio_dashboard,
                "resumo_contabil": resumo_contabil,
            }
        ), 200

    except Exception as e:
        return jsonify(
            {"error": "get dash cliente failed", "details": str(e)}
        ), 500

    finally:
        if conn:
            conn.close()