# controllers/gamaController.py

import os
import time
import logging
from datetime import datetime
from flask import request, jsonify
from config.db import get_connection

from services.gama_service import GamaService, GamaServiceError

logger = logging.getLogger(__name__)

# =========================
# FUNÇÕES AUXILIARES (BANCO E FORMATAÇÃO)
# =========================

def _customer_id_exists(cur, customer_id: int) -> bool:
    cur.execute("SELECT 1 FROM public.clientes WHERE id = %s LIMIT 1;", (customer_id,))
    return cur.fetchone() is not None

def _get_saved_latest_analises_from_db(user_id: int, categoria: str) -> dict:
    """
    Busca a análise mais recente filtrando por CATEGORIA ('produto' ou 'clientes').
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return {"error": "Invalid user_id", "status": 400}

        # 1. Busca a data mais recente DA CATEGORIA ESPECÍFICA
        cur.execute("""
            SELECT created_at FROM public.analises_ia_user_curva_abc
            WHERE user_id = %s AND categoria = %s 
            ORDER BY created_at DESC, id DESC LIMIT 1;
        """, (user_id, categoria))
        
        last = cur.fetchone()
        
        if not last:
            return {
                "analises": [], 
                "status": 404, 
                "message": f"Nenhuma análise de '{categoria}' encontrada."
            }

        created_at_ref = last[0]

        # 2. Busca os dados usando a data e a categoria
        cur.execute("""
            SELECT id, user_id, aspecto_avaliado, evidencias, plano_de_acao, 
                   riscos_associados, situacao_identificada, created_at
            FROM public.analises_ia_user_curva_abc
            WHERE user_id = %s 
              AND created_at = %s 
              AND categoria = %s
            ORDER BY id ASC;
        """, (user_id, created_at_ref, categoria))
        
        rows = cur.fetchall()
        analises = []
        for r in rows:
            analises.append({
                "id": r[0], "user_id": r[1], "aspecto_avaliado": r[2],
                "evidencias": r[3] or [], "plano_de_acao": r[4] or [],
                "riscos_associados": r[5] or [], "situacao_identificada": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
            })

        return {
            "user_id": user_id,
            "created_at_ref": created_at_ref.isoformat() if created_at_ref else None,
            "analises": analises,
            "categoria": categoria,
            "status": 200,
        }
    except Exception as e:
        logger.error(f"DB Error: {e}")
        return {"error": str(e), "status": 500}
    finally:
        if conn: conn.close()

def _build_input_text_from_analises(payload: dict) -> str:
    user_id = payload.get("user_id")
    analises = payload.get("analises", [])
    categoria = payload.get("categoria", "produto").capitalize() # Ex: "Produto" ou "Clientes"
    
    # Título Dinâmico
    titulo_relatorio = f"Relatório Executivo: {categoria} (Curva ABC)"
    
    lines = [f"# {titulo_relatorio} - ID {user_id}", "\n---\n"]
    
    lines.append("# Visão Geral")
    lines.append(f"* Este documento apresenta insights estratégicos sobre a base de {categoria}.")
    lines.append(f"* Análise gerada via IA com base em {len(analises)} pontos de atenção.")
    lines.append("\n---\n")

    for a in analises:
        aspecto = a.get("aspecto_avaliado", "Análise")
        lines.append(f"# {aspecto}")
        if a.get("situacao_identificada"):
            lines.append(f"## Situação Atual: {a['situacao_identificada']}")
        
        if a.get("evidencias"):
            lines.append("\n## Evidências & Dados")
            for item in a["evidencias"][:5]: lines.append(f"* {item}")
            
        if a.get("riscos_associados"):
            lines.append("\n## Riscos Identificados")
            for item in a["riscos_associados"][:5]: lines.append(f"* {item}")

        if a.get("plano_de_acao"):
            lines.append("\n## Plano de Ação Recomendado")
            for item in a["plano_de_acao"][:5]: lines.append(f"* {item}")
            
        lines.append("\n---\n")

    lines.append("# Conclusão e Próximos Passos")
    lines.append("* Priorizar as ações de alto impacto listadas.")
    lines.append("* Revisar os resultados no próximo ciclo.")
    return "\n".join(lines)


# =========================
# CONTROLLER PRINCIPAL
# =========================

def generate_gama_presentation_from_latest_insights(current_user):
    try:
        # 1. Obter parâmetros (User ID e TYPE)
        user_id = request.args.get("user_id", type=int)
        # Captura o tipo da URL (?type=clientes ou ?type=produto)
        analysis_type = request.args.get("type", default="produto", type=str)
        
        body_data = request.get_json() or {}

        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        # ---------------------------------------------------------------------
        # 2. BUSCA DADOS REAIS DO BANCO (FILTRANDO POR CATEGORIA)
        # ---------------------------------------------------------------------
        db_data = _get_saved_latest_analises_from_db(user_id, categoria=analysis_type)
        
        if db_data.get("status") != 200:
            return jsonify(db_data), db_data.get("status")

        input_text_content = _build_input_text_from_analises(db_data)
        
        if not input_text_content or len(input_text_content) < 50:
            return jsonify({"error": "Texto gerado insuficiente."}), 400

        # ---------------------------------------------------------------------
        # 3. PREPARAÇÃO DO SERVIÇO E TEMA
        # ---------------------------------------------------------------------
        service = GamaService()
        
        requested_theme = body_data.get("themeId", "Oasis")
        final_theme_id = service.get_theme_id_by_name(requested_theme)
        
        # ---------------------------------------------------------------------
        # 4. MONTAGEM DO PAYLOAD
        # ---------------------------------------------------------------------
        text_opts = body_data.get("textOptions", {})
        img_opts = body_data.get("imageOptions", {})

        payload = {
            "inputText": input_text_content,
            "textMode": "generate",
            "themeId": final_theme_id,
            "format": "presentation",
            "exportAs": "pptx", 
            "numCards": body_data.get("numCards", 10),
            "cardSplit": "inputTextBreaks",
            
            "textOptions": {
                "language": text_opts.get("language", "pt-br").lower(),
                "tone": text_opts.get("tone", "executive"),
                "amount": text_opts.get("amount", "detailed")
            },
            "imageOptions": {
                "source": img_opts.get("source", "aiGenerated"),
                "style": img_opts.get("style", "professional, clean")
            }
        }
        
        payload = {k: v for k, v in payload.items() if v is not None}

        # ---------------------------------------------------------------------
        # 5. EXECUÇÃO E ESPERA (WAIT)
        # ---------------------------------------------------------------------
        logger.info(f"Iniciando geração Gamma ({analysis_type}) para user_id={user_id}")
        generation_id = service.create_generation(payload)
        
        logger.info(f"Aguardando conclusão da geração {generation_id}...")
        result = service.wait_until_completed(generation_id, max_wait_s=300)
        
        return jsonify({
            "message": "Apresentação gerada com sucesso!",
            "generation_id": result.generation_id,
            "status": result.status,
            "theme_used": requested_theme,
            "categoria": analysis_type,
            "gamma_link": result.gamma_url, 
            "pptx_download_url": result.export_url 
        }), 200

    except GamaServiceError as e:
        logger.error(f"Gama API Error: {e}")
        return jsonify({"error": "gama_api_error", "details": str(e)}), 400
    except Exception as e:
        logger.exception("Server Error")
        return jsonify({"error": "internal_error", "details": str(e)}), 500