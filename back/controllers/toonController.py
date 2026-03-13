# toonController.py
#
# GET /toon?user_id=<hash>
# - Detecta automaticamente o ano mais recente com dados do cliente (public.receita_user.data_emissao)
# - Calcula Curva ABC por produto/serviço (agrupado) nesse ano
# - Retorna TUDO (sem paginação) em formato TOON

from decimal import Decimal
from flask import request, jsonify
from config.db import get_connection


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


def _classifica_abc(cum_pct: Decimal, a_limit=Decimal("0.80"), b_limit=Decimal("0.95")) -> str:
    if cum_pct <= a_limit:
        return "A"
    if cum_pct <= b_limit:
        return "B"
    return "C"


def _find_most_recent_year(cur, user_id: str) -> int | None:
    cur.execute(
        """
        SELECT MAX(EXTRACT(YEAR FROM data_emissao))::int
        FROM public.receita_user
        WHERE user_id = %s;
        """,
        (user_id,),
    )
    y = cur.fetchone()[0]
    return int(y) if y else None


def toon_abc_ano_recente(current_user=None, user_id: str | None = None):
    """
    Querystring:
      /toon?user_id=<hash>
      /toon?user_id=<hash>&a_limit=0.8&b_limit=0.95

    Resposta (TOON):
      {
        "toon": {
          "meta": {...},
          "rows": [...]
        }
      }
    """

    if user_id is None:
        user_id = request.args.get("user_id")

    user_id = str(user_id).strip() if user_id is not None else ""
    if not user_id:
        return jsonify({"error": "Missing or invalid user_id"}), 400

    # limites ABC opcionais via querystring
    try:
        a_limit_dec = Decimal(str(request.args.get("a_limit", "0.80")))
        b_limit_dec = Decimal(str(request.args.get("b_limit", "0.95")))
    except Exception:
        a_limit_dec = Decimal("0.80")
        b_limit_dec = Decimal("0.95")

    if a_limit_dec <= 0:
        a_limit_dec = Decimal("0.80")
    if b_limit_dec <= a_limit_dec:
        b_limit_dec = Decimal("0.95")

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return jsonify(
                {"error": "Invalid user_id", "details": "user_id must exist in public.clientes.id"}
            ), 400

        year = _find_most_recent_year(cur, user_id)
        if not year:
            return jsonify(
                {
                    "toon": {
                        "meta": {
                            "user_id": user_id,
                            "year": None,
                            "a_limit": str(a_limit_dec),
                            "b_limit": str(b_limit_dec),
                            "total_valor": "0.00",
                            "total_itens": 0,
                        },
                        "rows": [],
                    }
                }
            ), 200

        # total do ano (para %)
        cur.execute(
            """
            SELECT COALESCE(SUM(valor_total), 0)
            FROM public.receita_user
            WHERE user_id = %s
              AND EXTRACT(YEAR FROM data_emissao)::int = %s;
            """,
            (user_id, year),
        )
        total_valor = cur.fetchone()[0] or 0
        total_valor_dec = Decimal(str(total_valor))

        if total_valor_dec <= 0:
            return jsonify(
                {
                    "toon": {
                        "meta": {
                            "user_id": user_id,
                            "year": year,
                            "a_limit": str(a_limit_dec),
                            "b_limit": str(b_limit_dec),
                            "total_valor": "0.00",
                            "total_itens": 0,
                        },
                        "rows": [],
                    }
                }
            ), 200

        # agrega e ordena (sem paginação)
        cur.execute(
            """
            SELECT
              produto_ou_servico,
              nome_produto_ou_servico,
              COALESCE(SUM(valor_total), 0) AS total_valor_item
            FROM public.receita_user
            WHERE user_id = %s
              AND EXTRACT(YEAR FROM data_emissao)::int = %s
            GROUP BY produto_ou_servico, nome_produto_ou_servico
            ORDER BY total_valor_item DESC, nome_produto_ou_servico ASC;
            """,
            (user_id, year),
        )
        rows_db = cur.fetchall()

        rows = []
        cum_running = Decimal("0")

        for idx, r in enumerate(rows_db):
            produto_ou_servico, nome_produto_ou_servico, total_valor_item = r
            total_item_dec = Decimal(str(total_valor_item))

            pct = (total_item_dec / total_valor_dec)
            cum_running += total_item_dec
            cum_pct = (cum_running / total_valor_dec)

            rows.append(
                {
                    "rank": idx + 1,
                    "tipo": produto_ou_servico,
                    "nome": nome_produto_ou_servico,
                    "valor": str(total_item_dec.quantize(Decimal("0.01"))),
                    "pct": str((pct * 100).quantize(Decimal("0.01"))),
                    "pct_acu": str((cum_pct * 100).quantize(Decimal("0.01"))),
                    "classe": _classifica_abc(cum_pct, a_limit_dec, b_limit_dec),
                }
            )

        return jsonify(
            {
                "toon": {
                    "meta": {
                        "user_id": user_id,
                        "year": year,
                        "a_limit": str(a_limit_dec),
                        "b_limit": str(b_limit_dec),
                        "total_valor": str(total_valor_dec.quantize(Decimal("0.01"))),
                        "total_itens": len(rows),
                    },
                    "rows": rows,
                }
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "toon failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()