# controllers/ltClienteController.py

from flask import jsonify, request
from math import ceil
from config.db import get_connection


def list_lt_clientes(current_user=None, user_id: int = 0):
    if not user_id or int(user_id) <= 0:
        return jsonify({"error": "Invalid user_id"}), 400

    # paginação
    allowed_per_page = {10, 50, 100}
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
    except ValueError:
        return jsonify({"error": "Invalid pagination params (page/per_page must be integers)"}), 400

    if page < 1:
        return jsonify({"error": "Invalid page (must be >= 1)"}), 400

    if per_page not in allowed_per_page:
        return jsonify({"error": "Invalid per_page (allowed: 10, 50, 100)"}), 400

    offset = (page - 1) * per_page

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Base filtro reaproveitável (garante consistência em todas as queries)
        base_where = """
            WHERE user_id = %s
              AND data_emissao IS NOT NULL
              AND nome_cliente IS NOT NULL
              AND TRIM(nome_cliente) <> ''
        """

        # 1) TOTAL de clientes únicos (para paginação)
        cur.execute(
            f"""
            SELECT COUNT(*)::int
            FROM (
              SELECT 1
              FROM public.receita_user
              {base_where}
              GROUP BY nome_cliente
            ) t;
            """,
            (int(user_id),),
        )
        total_items = cur.fetchone()[0] or 0
        total_pages = int(ceil(total_items / per_page)) if total_items > 0 else 0

        # 2) Cliente com MAIOR LT (GLOBAL)
        cur.execute(
            f"""
            SELECT
              nome_cliente,
              (MAX(data_emissao) - MIN(data_emissao))::int AS lt_dias
            FROM public.receita_user
            {base_where}
            GROUP BY nome_cliente
            ORDER BY lt_dias DESC, nome_cliente ASC
            LIMIT 1;
            """,
            (int(user_id),),
        )
        row_max = cur.fetchone()
        cliente_maior_lt = row_max[0] if row_max else None
        maior_lt_dias = int(row_max[1]) if row_max and row_max[1] is not None else None

        # 3) Cliente com MENOR LT (GLOBAL)
        # Observação: muitos clientes terão lt_dias=0 (1 compra só ou mesma data).
        cur.execute(
            f"""
            SELECT
              nome_cliente,
              (MAX(data_emissao) - MIN(data_emissao))::int AS lt_dias
            FROM public.receita_user
            {base_where}
            GROUP BY nome_cliente
            ORDER BY lt_dias ASC, nome_cliente ASC
            LIMIT 1;
            """,
            (int(user_id),),
        )
        row_min = cur.fetchone()
        cliente_menor_lt = row_min[0] if row_min else None
        menor_lt_dias = int(row_min[1]) if row_min and row_min[1] is not None else None

        # 4) LISTA paginada (dados da página)
        cur.execute(
            f"""
            SELECT
              nome_cliente,
              MIN(data_emissao) AS primeira_compra,
              MAX(data_emissao) AS ultima_compra,
              (MAX(data_emissao) - MIN(data_emissao))::int AS lt_dias,
              COUNT(*)::int AS compras_total,
              (CURRENT_DATE - MAX(data_emissao))::int AS dias_desde_ultima_compra,
              CASE
                WHEN COUNT(*) > 1
                  THEN ((MAX(data_emissao) - MIN(data_emissao))::numeric / (COUNT(*) - 1))::numeric(10,2)
                ELSE NULL
              END AS media_intervalo_dias
            FROM public.receita_user
            {base_where}
            GROUP BY nome_cliente
            ORDER BY lt_dias DESC, compras_total DESC, nome_cliente ASC
            LIMIT %s OFFSET %s;
            """,
            (int(user_id), int(per_page), int(offset)),
        )

        rows = cur.fetchall()

        clientes = []
        for r in rows:
            clientes.append(
                {
                    "nome_cliente": r[0],
                    "primeira_compra": r[1].isoformat() if r[1] else None,
                    "ultima_compra": r[2].isoformat() if r[2] else None,
                    "lt_dias": int(r[3]) if r[3] is not None else 0,
                    "compras_total": int(r[4]) if r[4] is not None else 0,
                    "dias_desde_ultima_compra": int(r[5]) if r[5] is not None else None,
                    "media_intervalo_dias": float(r[6]) if r[6] is not None else None,
                }
            )

        payload = {
            "resumo": {
                "user_id": int(user_id),
                "clientes_unicos": int(total_items),

                "cliente_maior_lt": cliente_maior_lt,
                "maior_lt_dias": maior_lt_dias,

                "cliente_menor_lt": cliente_menor_lt,
                "menor_lt_dias": menor_lt_dias,
            },
            "pagination": {
                "items_on_page": len(clientes),
                "page": page,
                "per_page": per_page,
                "total_items": int(total_items),
                "total_pages": int(total_pages),
            },
            "lt_clientes": clientes,
        }

        return jsonify(payload), 200

    except Exception as e:
        return jsonify({"error": "lt-clientes failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()
