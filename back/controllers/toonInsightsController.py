# controllers/toonInsightsController.py

from flask import request, jsonify
from config.db import get_connection
from psycopg2.extras import Json

from services.mistral_service import (
    gerar_insights_curva_abc_toon,
    MistralServiceError,
)
from controllers.toonController import toon_abc_ano_recente
from utils.helpers import generate_secure_id


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


def _normalize_analise_item(item: dict) -> dict:
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

    return {
        "aspecto_avaliado": aspecto,
        "evidencias": evidencias,
        "plano_de_acao": plano,
        "riscos_associados": riscos,
        "situacao_identificada": situacao,
    }


def _save_analises_to_db(user_id: str, analises: list[dict], categoria: str = "produto") -> dict:
    """
    Salva os insights no banco.
    Aceita 'categoria' para diferenciar 'produto' de 'clientes'.
    """
    if not analises:
        return {"inserted": 0, "ids": []}

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return {
                "error": "Invalid user_id",
                "details": "user_id must exist in public.clientes.id",
            }

        inserted_ids: list[str] = []

        for item in analises:
            normalized = _normalize_analise_item(item)

            if not normalized.get("aspecto_avaliado") or not normalized.get("situacao_identificada"):
                continue

            novo_id = generate_secure_id()

            cur.execute(
                """
                INSERT INTO public.analises_ia_user_curva_abc
                    (id, user_id, aspecto_avaliado, evidencias, plano_de_acao, riscos_associados, situacao_identificada, categoria)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
                """,
                (
                    novo_id,
                    user_id,
                    normalized["aspecto_avaliado"],
                    Json(normalized["evidencias"]),
                    Json(normalized["plano_de_acao"]),
                    Json(normalized["riscos_associados"]),
                    normalized["situacao_identificada"],
                    categoria
                ),
            )

            r = cur.fetchone()
            if r and r[0]:
                inserted_ids.append(r[0])

        conn.commit()
        return {"inserted": len(inserted_ids), "ids": inserted_ids}

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[ERROR DB] Falha ao salvar insights: {str(e)}")
        return {"error": "db_save_failed", "details": str(e)}
    finally:
        if conn:
            conn.close()


# =========================
# CREATE/REFRESH INSIGHTS (GERAR NOVOS)
# =========================
def get_toon_insights(current_user=None):
    user_id = request.args.get("user_id")
    analysis_type = request.args.get("type", default="produto", type=str)

    user_id = str(user_id).strip() if user_id is not None else ""
    if not user_id:
        return jsonify({"error": "Missing or invalid user_id"}), 400

    toon_resp, status = toon_abc_ano_recente(current_user=current_user, user_id=user_id)
    if status != 200:
        return toon_resp, status

    toon_payload = toon_resp.get_json(silent=True) or {}
    toon_block = toon_payload.get("toon") or {}
    toon_meta = toon_block.get("meta") or {}
    toon_rows = toon_block.get("rows") or []

    if not toon_rows:
        return (
            jsonify(
                {
                    "user_id": user_id,
                    "ano_base": toon_meta.get("year"),
                    "analises": [],
                    "warning": f"TOON vazio para este {analysis_type} no ano mais recente.",
                    "db": {"inserted": 0, "ids": []},
                }
            ),
            200,
        )

    try:
        insights = gerar_insights_curva_abc_toon(toon_rows, analysis_type=analysis_type)
    except MistralServiceError as e:
        return jsonify({"error": "mistral_service_error", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "toon_insights_failed", "details": str(e)}), 500

    analises = insights.get("analises", [])
    if not isinstance(analises, list):
        analises = []

    db_result = _save_analises_to_db(user_id=user_id, analises=analises, categoria=analysis_type)

    return (
        jsonify(
            {
                "user_id": user_id,
                "ano_base": toon_meta.get("year"),
                "categoria": analysis_type,
                "analises": analises,
                "toon_meta": toon_meta,
                "db": db_result,
            }
        ),
        200,
    )


# =========================
# LISTAR INSIGHTS SALVOS (COM FILTRO DE CATEGORIA)
# =========================
def get_toon_insights_saved_latest(current_user=None):
    """
    GET /toon/insights/saved/latest?user_id=<hash>&type=clientes

    - Busca o lote mais recente da CATEGORIA solicitada.
    """
    user_id = request.args.get("user_id")
    categoria_filter = request.args.get("type", default="produto", type=str)

    user_id = str(user_id).strip() if user_id is not None else ""
    if not user_id:
        return jsonify({"error": "Missing or invalid user_id"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return jsonify({"error": "Invalid user_id", "details": "user_id not found"}), 400

        # ETAPA 1: pega a data mais recente da categoria solicitada
        cur.execute(
            """
            SELECT created_at
            FROM public.analises_ia_user_curva_abc
            WHERE user_id = %s
              AND categoria = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1;
            """,
            (user_id, categoria_filter),
        )
        last = cur.fetchone()

        if not last:
            return (
                jsonify(
                    {
                        "user_id": user_id,
                        "categoria": categoria_filter,
                        "created_at_ref": None,
                        "analises": [],
                        "warning": f"Nenhuma análise de '{categoria_filter}' salva encontrada.",
                    }
                ),
                200,
            )

        created_at_ref = last[0]

        # ETAPA 2: busca os registros com a mesma data e categoria
        cur.execute(
            """
            SELECT
                id,
                user_id,
                aspecto_avaliado,
                evidencias,
                plano_de_acao,
                riscos_associados,
                situacao_identificada,
                created_at,
                categoria
            FROM public.analises_ia_user_curva_abc
            WHERE user_id = %s
              AND created_at = %s
              AND categoria = %s
            ORDER BY id ASC;
            """,
            (user_id, created_at_ref, categoria_filter),
        )
        rows = cur.fetchall()

        analises = []
        for r in rows:
            analises.append(
                {
                    "id": r[0],
                    "user_id": r[1],
                    "aspecto_avaliado": r[2],
                    "evidencias": r[3] if r[3] is not None else [],
                    "plano_de_acao": r[4] if r[4] is not None else [],
                    "riscos_associados": r[5] if r[5] is not None else [],
                    "situacao_identificada": r[6],
                    "created_at": r[7].isoformat() if r[7] else None,
                    "categoria": r[8]
                }
            )

        return (
            jsonify(
                {
                    "user_id": user_id,
                    "categoria": categoria_filter,
                    "created_at_ref": created_at_ref.isoformat() if created_at_ref else None,
                    "analises": analises,
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": "get_saved_latest_failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()