from decimal import Decimal, InvalidOperation
from flask import request, jsonify
from config.db import get_connection
from math import ceil
from datetime import datetime
from utils.helpers import generate_secure_id


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
            return jsonify({"error": "Invalid user_id"}), 400

        # --- GERAÇÃO DO ID SEGURO ---
        novo_id = generate_secure_id()
        
        columns = ["id"] + list(payload.keys())
        values = [novo_id] + [payload[c] for c in payload.keys()]
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

        return jsonify({
            "message": "Análise de margem criada",
            "analise_margem": {
                "id": r[0], # Retornará a string de 128 caracteres
                "user_id": r[1],
                "produto_ou_servico": r[2],
                "custo": str(r[3]) if r[3] is not None else None,
                "hora_homem": str(r[4]) if r[4] is not None else None,
                "imposto": str(r[5]) if r[5] is not None else None,
                "margem_bruta": str(r[6]) if r[6] is not None else None,
                "comissao": str(r[7]) if r[7] is not None else None,
                "frete": str(r[8]) if r[8] is not None else None,
            },
        }), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": "create failed", "details": str(e)}), 500
    finally:
        if conn: conn.close()

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
def get_analise_margem(current_user=None, margem_id: str = ""):
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

        return jsonify({
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
        }), 200
    except Exception as e:
        return jsonify({"error": "get failed", "details": str(e)}), 500
    finally:
        if conn: conn.close()


# =========================
# UPDATE
# =========================
def update_analise_margem(current_user=None, margem_id: str = ""):
    data = request.get_json(silent=True) or {}
    payload = {k: data[k] for k in data.keys() if k in FIELDS}

    if not payload:
        return jsonify({"error": "No valid fields to update"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        _try_calc_margem_bruta(payload)

        set_parts = []
        values = []
        for k, v in payload.items():
            set_parts.append(f"{k} = %s")
            values.append(v)

        values.append(margem_id)

        cur.execute(
            f"UPDATE public.analise_margem SET {', '.join(set_parts)} WHERE id = %s;",
            tuple(values),
        )

        if cur.rowcount == 0:
            return jsonify({"error": "Registro não encontrado"}), 404

        conn.commit()
        return jsonify({"message": "Análise de margem atualizada"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": "update failed", "details": str(e)}), 500
    finally:
        if conn: conn.close()


# =========================
# DELETE
# =========================
def delete_analise_margem(current_user=None, margem_id: str = ""):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM public.analise_margem WHERE id = %s;", (margem_id,))
        
        if cur.rowcount == 0:
            return jsonify({"error": "Registro não encontrado"}), 404

        conn.commit()
        return jsonify({"message": "Análise de margem removida"}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": "delete failed", "details": str(e)}), 500
    finally:
        if conn: conn.close()


def dashboard_analise_margem(
    current_user=None,
    user_id: int | None = None,
    ano: int | None = None,
):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # =========================
        # Buscar anos disponíveis
        # =========================
        available_years_filters = []
        available_years_params = []

        if user_id:
            available_years_filters.append("user_id = %s")
            available_years_params.append(user_id)

        available_years_where = (
            f"WHERE {' AND '.join(available_years_filters)}"
            if available_years_filters
            else ""
        )

        cur.execute(
            f"""
            SELECT DISTINCT EXTRACT(YEAR FROM created_at)::INT AS ano
            FROM public.analise_margem
            {available_years_where}
            WHERE created_at IS NOT NULL
            ORDER BY ano DESC;
            """
            if not available_years_where
            else
            f"""
            SELECT DISTINCT EXTRACT(YEAR FROM created_at)::INT AS ano
            FROM public.analise_margem
            {available_years_where} AND created_at IS NOT NULL
            ORDER BY ano DESC;
            """,
            tuple(available_years_params),
        )

        anos_rows = cur.fetchall()
        anos_disponiveis = [int(row[0]) for row in anos_rows if row[0] is not None]

        # Se não vier ano na URL, usa o mais recente disponível
        ano_filtrado = ano if ano else (anos_disponiveis[0] if anos_disponiveis else None)

        # =========================
        # Montar filtros principais
        # =========================
        filters = []
        params = []

        if user_id:
            filters.append("user_id = %s")
            params.append(user_id)

        if ano_filtrado:
            filters.append("EXTRACT(YEAR FROM created_at) = %s")
            params.append(ano_filtrado)

        where_sql = f"WHERE {' AND '.join(filters)}" if filters else ""

        # =========================
        # Resumo principal
        # =========================
        cur.execute(
            f"""
            SELECT
                COUNT(*) AS itens_analisados,
                COALESCE(SUM(margem_bruta), 0) AS margem_total,
                COALESCE(SUM(custo), 0) AS custo_total,
                COALESCE(AVG(margem_bruta), 0) AS media_por_item
            FROM public.analise_margem
            {where_sql};
            """,
            tuple(params),
        )

        resumo_row = cur.fetchone()
        itens_analisados = int(resumo_row[0] or 0)
        margem_total = float(resumo_row[1] or 0)
        custo_total = float(resumo_row[2] or 0)
        media_por_item = float(resumo_row[3] or 0)

        # =========================
        # Melhor margem
        # =========================
        cur.execute(
            f"""
            SELECT
                produto_ou_servico,
                margem_bruta,
                custo,
                id
            FROM public.analise_margem
            {where_sql}
            ORDER BY margem_bruta DESC NULLS LAST, id ASC
            LIMIT 1;
            """,
            tuple(params),
        )
        best_row = cur.fetchone()

        melhor_margem = None
        if best_row:
            melhor_margem = {
                "produto_ou_servico": best_row[0],
                "margem_bruta": float(best_row[1] or 0),
                "custo": float(best_row[2] or 0),
                "id": best_row[3],
            }

        # =========================
        # Pior margem
        # =========================
        cur.execute(
            f"""
            SELECT
                produto_ou_servico,
                margem_bruta,
                custo,
                id
            FROM public.analise_margem
            {where_sql}
            ORDER BY margem_bruta ASC NULLS LAST, id ASC
            LIMIT 1;
            """,
            tuple(params),
        )
        worst_row = cur.fetchone()

        pior_margem = None
        if worst_row:
            pior_margem = {
                "produto_ou_servico": worst_row[0],
                "margem_bruta": float(worst_row[1] or 0),
                "custo": float(worst_row[2] or 0),
                "id": worst_row[3],
            }

        # =========================
        # Top 10 por margem
        # =========================
        cur.execute(
            f"""
            SELECT
                id,
                produto_ou_servico,
                COALESCE(margem_bruta, 0) AS margem_bruta,
                COALESCE(custo, 0) AS custo
            FROM public.analise_margem
            {where_sql}
            ORDER BY margem_bruta DESC NULLS LAST, id ASC
            LIMIT 10;
            """,
            tuple(params),
        )

        top10_margem = []
        for row in cur.fetchall():
            top10_margem.append(
                {
                    "id": row[0],
                    "produto_ou_servico": row[1],
                    "margem_bruta": float(row[2] or 0),
                    "custo": float(row[3] or 0),
                }
            )

        # =========================
        # Top 10 por custo
        # =========================
        cur.execute(
            f"""
            SELECT
                id,
                produto_ou_servico,
                COALESCE(margem_bruta, 0) AS margem_bruta,
                COALESCE(custo, 0) AS custo
            FROM public.analise_margem
            {where_sql}
            ORDER BY custo DESC NULLS LAST, id ASC
            LIMIT 10;
            """,
            tuple(params),
        )

        top10_custo = []
        for row in cur.fetchall():
            top10_custo.append(
                {
                    "id": row[0],
                    "produto_ou_servico": row[1],
                    "margem_bruta": float(row[2] or 0),
                    "custo": float(row[3] or 0),
                }
            )

        # =========================
        # Distribuição por categoria
        # =========================
        cur.execute(
            f"""
            SELECT
                produto_ou_servico AS categoria,
                COUNT(*) AS total_itens,
                COALESCE(SUM(margem_bruta), 0) AS margem_total,
                COALESCE(SUM(custo), 0) AS custo_total
            FROM public.analise_margem
            {where_sql}
            GROUP BY produto_ou_servico
            ORDER BY margem_total DESC, categoria ASC;
            """,
            tuple(params),
        )

        distribuicao_categoria = []
        rows = cur.fetchall()

        for row in rows:
            margem_cat = float(row[2] or 0)
            percentual = (margem_cat / margem_total * 100) if margem_total > 0 else 0

            distribuicao_categoria.append(
                {
                    "categoria": row[0],
                    "total_itens": int(row[1] or 0),
                    "margem_total": margem_cat,
                    "custo_total": float(row[3] or 0),
                    "percentual_margem": round(percentual, 2),
                }
            )

        return jsonify(
            {
                "filtros": {
                    "user_id": user_id,
                    "ano": ano_filtrado,
                    "anos_disponiveis": anos_disponiveis,
                },
                "resumo": {
                    "margem_total": round(margem_total, 2),
                    "custo_total": round(custo_total, 2),
                    "media_por_item": round(media_por_item, 2),
                    "itens_analisados": itens_analisados,
                    "melhor_margem": melhor_margem,
                    "pior_margem": pior_margem,
                },
                "top10_margem": top10_margem,
                "top10_custo": top10_custo,
                "distribuicao_categoria": distribuicao_categoria,
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "dashboard failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()