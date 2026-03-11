# controllers/ticketMedioInsightsController.py

from flask import request, jsonify
from config.db import get_connection
from psycopg2.extras import Json
from uuid import uuid4
from datetime import datetime, timezone
import traceback

from services.mistral_services_tk import (
    gerar_insights_ticket_medio,
    MistralServiceError,
)

from controllers.ticketMedioController import list_ticket_medio_produtos


# =========================
# HELPERS DB
# =========================
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


def _get_customer_ipca(cur, user_id: int):
    cur.execute(
        """
        SELECT ipca
        FROM public.clientes
        WHERE id = %s
        LIMIT 1;
        """,
        (user_id,),
    )
    r = cur.fetchone()
    return r[0] if r else None


def _normalize_analise_item(item: dict) -> dict:
    """
    Força o shape padrão SEMPRE.
    """
    if not isinstance(item, dict):
        return {}

    aspecto = item.get("aspecto_avaliado")
    evidencias = item.get("evidencias", [])
    plano = item.get("plano_de_acao", [])
    riscos = item.get("riscos_associados", [])
    situacao = item.get("situacao_identificada")

    if not isinstance(evidencias, list):
        evidencias = []
    if not isinstance(plano, list):
        plano = []
    if not isinstance(riscos, list):
        riscos = []

    # situação pode ser string ou lista
    if situacao is None:
        situacao = []
    if isinstance(situacao, str):
        situacao = [situacao]
    if not isinstance(situacao, list):
        situacao = []

    return {
        "aspecto_avaliado": aspecto,
        "evidencias": evidencias,
        "plano_de_acao": plano,
        "riscos_associados": riscos,
        "situacao_identificada": situacao,
    }


def _save_analises_to_db(
    user_id: int,
    analises: list[dict],
    year: int,
    year_a: int,
    year_b: int,
    meta: dict,
) -> dict:
    """
    Salva na nova tabela: public.analises_ia_user_tk
    Cria um batch_id para agrupar o lote.
    """
    if not analises:
        return {"inserted": 0, "ids": [], "batch_id": None}

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return {
                "error": "Invalid user_id",
                "details": "user_id must exist in public.clientes.id",
            }

        customer_ipca = _get_customer_ipca(cur, user_id)

        batch_id = str(uuid4())
        inserted_ids: list[int] = []

        for item in analises:
            normalized = _normalize_analise_item(item)

            if not normalized.get("aspecto_avaliado") or not normalized.get("situacao_identificada"):
                continue

            cur.execute(
                """
                INSERT INTO public.analises_ia_user_tk
                    (
                      batch_id,
                      user_id,
                      year, year_a, year_b,
                      customer_ipca,
                      aspecto_avaliado,
                      situacao_identificada,
                      riscos_associados,
                      plano_de_acao,
                      evidencias,
                      meta
                    )
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
                """,
                (
                    batch_id,
                    user_id,
                    year, year_a, year_b,
                    customer_ipca,
                    normalized["aspecto_avaliado"],
                    Json(normalized["situacao_identificada"]),
                    Json(normalized["riscos_associados"]),
                    Json(normalized["plano_de_acao"]),
                    Json(normalized["evidencias"]),
                    Json(meta or {}),
                ),
            )

            r = cur.fetchone()
            if r and r[0]:
                inserted_ids.append(r[0])

        conn.commit()
        return {"inserted": len(inserted_ids), "ids": inserted_ids, "batch_id": batch_id}

    except Exception as e:
        if conn:
            conn.rollback()
        return {"error": "db_save_failed", "details": str(e)}
    finally:
        if conn:
            conn.close()


def _collect_all_items_for_ai(current_user, user_id: int, year_a: int, year_b: int, q=None, date_from=None, date_to=None):
    """
    Coleta itens em múltiplas páginas (per_page=100) para alimentar a IA.
    """
    per_page = 100
    page = 1

    all_items = []
    summary = {}
    last_pagination = {}

    MAX_PAGES = 80        # 8.000 itens
    MAX_ITEMS = 8000

    while True:
        resp, status = list_ticket_medio_produtos(
            current_user=current_user,
            user_id=user_id,
            page=page,
            per_page=per_page,
            date_from=date_from,
            date_to=date_to,
            q=q,
            year_a=year_a,
            year_b=year_b,
        )

        if status != 200:
            return None, None, None, resp, status

        payload = resp.get_json(silent=True) or {}
        items = payload.get("items") or []
        summary = payload.get("summary") or summary
        last_pagination = payload.get("pagination") or last_pagination

        if items:
            all_items.extend(items)

        if not items:
            break

        if len(all_items) >= MAX_ITEMS:
            all_items = all_items[:MAX_ITEMS]
            break

        total_pages = int(last_pagination.get("total_pages") or 0)
        if total_pages and page >= total_pages:
            break

        page += 1
        if page > MAX_PAGES:
            break

    return all_items, summary, last_pagination, None, 200


# =========================
# GERAR INSIGHTS (NOVO)
# =========================
def get_ticket_medio_insights(current_user=None):
    """
    GET /ticket-medio/insights?user_id=10&year=2025
    """
    user_id = request.args.get("user_id", type=int)
    year = request.args.get("year", type=int)

    if not user_id or user_id <= 0:
        return jsonify({"error": "Missing or invalid user_id"}), 400

    if not year or year <= 1900:
        return jsonify({"error": "Missing or invalid year (e.g. 2025)"}), 400

    year_b = year
    year_a = year - 1

    q = request.args.get("q")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    # -------- coleta dados ----------
    try:
        all_items, summary, pagination, err_resp, err_status = _collect_all_items_for_ai(
            current_user=current_user,
            user_id=user_id,
            year_a=year_a,
            year_b=year_b,
            q=q,
            date_from=date_from,
            date_to=date_to,
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "collect_items_failed",
            "details": str(e),
            "where": "_collect_all_items_for_ai",
        }), 500

    if err_resp is not None:
        return err_resp, err_status

    summary = summary or {}
    summary["year_a"] = year_a
    summary["year_b"] = year_b
    summary["year"] = year

    if not all_items:
        return jsonify({
            "user_id": user_id,
            "categoria": "ticket_medio",
            "summary": summary,
            "pagination": pagination or {},
            "analises": [],
            "warning": "Ticket médio vazio para os filtros informados.",
            "db": {"inserted": 0, "ids": [], "batch_id": None},
        }), 200

    # -------- chama IA ----------
    try:
        insights = gerar_insights_ticket_medio(all_items, summary=summary)
    except MistralServiceError as e:
        traceback.print_exc()
        # upstream (IA), melhor 502
        return jsonify({
            "error": "ai_upstream_error",
            "details": str(e),
            "where": "gerar_insights_ticket_medio",
        }), 502
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "ticket_medio_insights_failed",
            "details": str(e),
            "where": "gerar_insights_ticket_medio",
        }), 500

    # -------- valida tipo ----------
    if not isinstance(insights, dict):
        return jsonify({
            "error": "invalid_ai_response",
            "details": f"IA retornou tipo inválido: {type(insights).__name__}",
        }), 502

    analises = insights.get("analises", [])
    if not isinstance(analises, list):
        analises = []

    # -------- normaliza (protegido) ----------
    try:
        analises_norm = []
        for a in analises:
            if not isinstance(a, dict):
                a = {"aspecto_avaliado": "Insight", "situacao_identificada": str(a)}
            analises_norm.append(_normalize_analise_item(a))
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "normalize_failed",
            "details": str(e),
            "where": "_normalize_analise_item",
            "sample": analises[0] if analises else None,
        }), 500

    # meta de auditoria
    meta = {
        "filters": {"q": q, "date_from": date_from, "date_to": date_to},
        "limits": {"max_items": 8000, "max_pages": 80},
        "stats": {
            "total_items_analyzed": len(all_items),
            "items_truncated": len(all_items) >= 8000,
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    # -------- salva DB ----------
    db_result = _save_analises_to_db(
        user_id=user_id,
        analises=analises_norm,
        year=year,
        year_a=year_a,
        year_b=year_b,
        meta=meta,
    )

    # ✅ aqui estava seu “bug”: DB pode falhar e você retornava 200 mesmo assim
    if isinstance(db_result, dict) and db_result.get("error"):
        return jsonify({
            "error": db_result.get("error"),
            "details": db_result.get("details"),
            "where": "_save_analises_to_db",
        }), 500

    return jsonify({
        "user_id": user_id,
        "categoria": "ticket_medio",
        "summary": summary,
        "pagination": pagination,
        "analises": analises_norm,
        "db": db_result,
    }), 200
# =========================
# LISTAR ÚLTIMO LOTE SALVO
# =========================
def get_ticket_medio_insights_saved_latest(current_user=None):
    """
    GET /ticket-medio/insights/saved/latest?user_id=10&year=2025

    - Se year vier, pega o último batch daquele ano
    - Se year não vier, pega o último batch geral
    """
    user_id = request.args.get("user_id", type=int)
    year = request.args.get("year", type=int)

    if not user_id or user_id <= 0:
        return jsonify({"error": "Missing or invalid user_id"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return jsonify({"error": "Invalid user_id", "details": "user_id not found"}), 400

        if year and year > 1900:
            cur.execute(
                """
                SELECT batch_id
                FROM public.analises_ia_user_tk
                WHERE user_id = %s
                  AND year = %s
                ORDER BY created_at DESC, id DESC
                LIMIT 1;
                """,
                (user_id, year),
            )
        else:
            cur.execute(
                """
                SELECT batch_id
                FROM public.analises_ia_user_tk
                WHERE user_id = %s
                ORDER BY created_at DESC, id DESC
                LIMIT 1;
                """,
                (user_id,),
            )

        last = cur.fetchone()
        if not last:
            return jsonify({
                "user_id": user_id,
                "categoria": "ticket_medio",
                "year": year,
                "batch_id": None,
                "analises": [],
                "warning": "Nenhuma análise de ticket médio salva encontrada.",
            }), 200

        batch_id = last[0]

        cur.execute(
            """
            SELECT
              id,
              batch_id,
              user_id,
              year, year_a, year_b,
              customer_ipca,
              aspecto_avaliado,
              situacao_identificada,
              riscos_associados,
              plano_de_acao,
              evidencias,
              meta,
              created_at
            FROM public.analises_ia_user_tk
            WHERE user_id = %s
              AND batch_id = %s
            ORDER BY id ASC;
            """,
            (user_id, batch_id),
        )
        rows = cur.fetchall()

        analises = []
        meta_out = {}
        summary_out = {}

        for r in rows:
            # meta e summary repetem em todas as linhas do batch; pega o primeiro
            meta_out = r[12] if r[12] is not None else meta_out

            summary_out = {
                "user_id": r[2],
                "year": r[3],
                "year_a": r[4],
                "year_b": r[5],
                "customer_ipca": str(r[6]) if r[6] is not None else None,
            }

            analises.append({
                "id": r[0],
                "aspecto_avaliado": r[7],
                "situacao_identificada": r[8] if r[8] is not None else [],
                "riscos_associados": r[9] if r[9] is not None else [],
                "plano_de_acao": r[10] if r[10] is not None else [],
                "evidencias": r[11] if r[11] is not None else [],
                "created_at": r[13].isoformat() if r[13] else None,
            })

        return jsonify({
            "user_id": user_id,
            "categoria": "ticket_medio",
            "batch_id": str(batch_id),
            "summary": summary_out,
            "meta": meta_out,
            "analises": analises,
        }), 200

    except Exception as e:
        return jsonify({"error": "get_saved_latest_failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()
