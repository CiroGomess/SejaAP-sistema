import os
import json
import re
from typing import Any, Dict, List, Optional, Union
from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Modelo Gemini 3 Flash Preview (última versão)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
GEMINI_TIMEOUT_SECONDS = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "120"))

# Lista de fallback de modelos para tentar em caso de erro
FALLBACK_MODELS = [
    "gemini-3-flash-preview",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b",
]


class MistralServiceError(Exception):
    pass


# ==============================================================================
# JSON PARSER ROBUSTO
# ==============================================================================

def _strip_code_fences(text: str) -> str:
    if not text:
        return ""
    t = text.strip()
    m = re.search(r"```(?:json|JSON)?\s*(.*?)\s*```", t, flags=re.DOTALL)
    if m:
        return (m.group(1) or "").strip()
    return t


def _try_json_loads(text: str) -> Optional[Union[Dict[str, Any], List[Any]]]:
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        return None


def _extract_json(text: str) -> Dict[str, Any]:
    raw = (text or "").strip()
    cleaned = _strip_code_fences(raw).strip()
    parsed = _try_json_loads(cleaned)

    if parsed is None:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1:
            parsed = _try_json_loads(cleaned[start: end + 1])

    if parsed is None:
        sample = cleaned[:500]
        print(f"[DEBUG] ERRO JSON: Não foi possível parsear. Inicio: {sample}")
        raise MistralServiceError(
            f"A IA não retornou um JSON válido. Amostra: {sample}..."
        )

    if isinstance(parsed, list):
        return {"analises": parsed}

    if isinstance(parsed, dict):
        if "analises" in parsed:
            return parsed
        if "aspecto_avaliado" in parsed:
            return {"analises": [parsed]}
        return parsed

    return {"analises": []}


# ==============================================================================
# CHAMADA GEMINI (substituindo Mistral)
# ==============================================================================

def gemini_chat_json(prompt: str) -> Dict[str, Any]:
    """
    Usa a biblioteca oficial google-generativeai para gerar conteúdo com Gemini
    """
    if not GEMINI_API_KEY:
        raise MistralServiceError("GEMINI_API_KEY não configurada.")

    # Lista de modelos para tentar
    models_to_try = [GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != GEMINI_MODEL]
    last_error = None

    for model_name in models_to_try:
        try:
            # Inicializa o cliente com a chave da API
            client = genai.Client(api_key=GEMINI_API_KEY)

            print(
                f"[DEBUG] Enviando requisição para Gemini (tentando modelo: {model_name})..."
            )

            # Configuração para gerar conteúdo com JSON
            config = types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=8192,
                response_mime_type="application/json",
            )

            # Faz a chamada à API
            response = client.models.generate_content(
                model=model_name, 
                contents=[prompt], 
                config=config
            )

            print(
                f"[DEBUG] Resposta recebida com sucesso usando modelo: {model_name}!"
            )

            # Extrai o texto da resposta
            if response and response.text:
                print(
                    f"[DEBUG] Resposta (primeiros 200 chars): {response.text[:200]}..."
                )
                return _extract_json(response.text)
            else:
                raise MistralServiceError("Resposta vazia da API Gemini")

        except Exception as e:
            error_msg = str(e)
            print(f"[DEBUG] Erro com modelo {model_name}: {error_msg}")
            last_error = e
            # Continua para o próximo modelo se houver

    # Se chegou aqui, todos os modelos falharam
    print("[DEBUG] Todos os modelos tentados falharam")
    raise MistralServiceError(
        f"Nenhum modelo Gemini disponível. Último erro: {str(last_error)}"
    )


# ==============================================================================
# TICKET MÉDIO (MINIFY + PROMPT + FUNÇÃO PRINCIPAL)
# ==============================================================================

def _to_float(v: Any) -> float:
    try:
        if v is None:
            return 0.0
        return float(str(v).replace(",", "."))
    except Exception:
        return 0.0


def _minify_ticket_medio_item(item: Dict[str, Any], year_a: int, year_b: int) -> Dict[str, Any]:
    """
    Minificação focada em Ticket Médio.

    Espera itens do ticketMedioController.py:
      nome_produto_ou_servico
      qtd_{year_a}, qtd_{year_b}
      ticket_{year_a}, ticket_{year_b}
      delta_ticket_pct
      ipca_delta_pct
    """
    nome = (
        item.get("nome_produto_ou_servico")
        or item.get("nome")
        or item.get("n")
        or "Item"
    )

    return {
        "n": str(nome),
        "qa": _to_float(item.get(f"qtd_{year_a}")),
        "qb": _to_float(item.get(f"qtd_{year_b}")),
        "ta": _to_float(item.get(f"ticket_{year_a}")),
        "tb": _to_float(item.get(f"ticket_{year_b}")),
        "dt": _to_float(item.get("delta_ticket_pct")),   # nominal %
        "dr": _to_float(item.get("ipca_delta_pct")),      # real % (nominal - IPCA)
    }


def build_ticket_medio_prompt(items: List[Dict[str, Any]], summary: Dict[str, Any]) -> str:
    """
    Prompt alinhado ao modelo da imagem:
      - Situação Identificada
      - Principais Riscos Associados
      - Plano de Ação
    """
    year_a = int(summary.get("year_a") or 2024)
    year_b = int(summary.get("year_b") or 2025)
    ipca = summary.get("customer_ipca") or "0"

    # 1) minifica
    optimized = [_minify_ticket_medio_item(i, year_a, year_b) for i in items]

    # 2) limite seguro
    SAFE_LIMIT = 4000
    if len(optimized) > SAFE_LIMIT:
        head = optimized[:SAFE_LIMIT]
        tail = optimized[SAFE_LIMIT:]
        head.append({
            "n": f"OUTROS ({len(tail)} itens agrupados)",
            "note": "Agregado para caber no limite",
        })
        optimized = head
        aviso = f"Você recebeu {SAFE_LIMIT} itens + 1 agregado (cauda longa)."
    else:
        aviso = "Você recebeu todos os itens."

    # 3) prompt
    return f"""
Você é um Consultor Sênior de Pricing e Performance Comercial.
Você recebeu dados de Ticket Médio por SKU/Serviço comparando {year_a} vs {year_b}.

OBJETIVO:
Gerar INSIGHTS no modelo corporativo da imagem:
- Situação Identificada
- Principais Riscos Associados
- Plano de Ação

REGRAS IMPORTANTES:
- Seja fiel aos números.
- Procure padrões de: aumento de volume com queda de ticket, descontos, mix, inflação (IPCA), risco de margem.
- Dê ações práticas: dashboard, análise por SKU, revisão de política de preço/desconto, correção por IPCA, etc.
- Retorne SOMENTE JSON VÁLIDO, SEM TEXTO EXTRA.

LEGENDA (JSON minificado):
n  = nome do produto/serviço
qa = quantidade em {year_a}
qb = quantidade em {year_b}
ta = ticket médio em {year_a}
tb = ticket médio em {year_b}
dt = variação nominal do ticket (%) {year_a}->{year_b}
dr = variação real do ticket (%) já descontando IPCA
IPCA do cliente: {ipca}%

CONTEXTO:
{aviso}

FORMATO OBRIGATÓRIO (JSON MODE):
{{
  "analises": [
    {{
      "aspecto_avaliado": "Título curto do insight (ex: Curva ABC de Produtos – Ticket Médio)",
      "situacao_identificada": [
        "1. ...",
        "2. ...",
        "3. ..."
      ],
      "riscos_associados": [
        "1. ...",
        "2. ...",
        "3. ..."
      ],
      "plano_de_acao": [
        "1. ...",
        "2. ...",
        "3. ..."
      ],
      "evidencias": [
        {{ "tipo": "quantitativa", "detalhe": "Exemplo: Produto X: qb>qa e dr negativo" }}
      ]
    }}
  ]
}}

DADOS (TICKET MÉDIO):
{json.dumps(optimized, ensure_ascii=False)}
""".strip()


def gerar_insights_ticket_medio(items: List[Dict[str, Any]], summary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Função principal: Ticket Médio -> IA -> JSON padrão.
    """
    print("\n[DEBUG] --- INICIANDO GERAR INSIGHTS (TICKET MÉDIO) ---")
    print(f"[DEBUG] Itens recebidos: {len(items)}")

    prompt = build_ticket_medio_prompt(items, summary=summary)
    result = gemini_chat_json(prompt)  # Mudado de mistral_chat_json para gemini_chat_json

    # garantia de retorno
    analises = result.get("analises")
    if not isinstance(analises, list):
        return {"analises": []}

    # Normaliza campos para bater com seu padrão SEMPRE
    normalized = []
    for a in analises:
        if not isinstance(a, dict):
            continue

        normalized.append({
            "aspecto_avaliado": a.get("aspecto_avaliado") or "Ticket Médio – Diagnóstico",
            "situacao_identificada": a.get("situacao_identificada") if isinstance(a.get("situacao_identificada"), list) else [str(a.get("situacao_identificada") or "")],
            "riscos_associados": a.get("riscos_associados") if isinstance(a.get("riscos_associados"), list) else [],
            "plano_de_acao": a.get("plano_de_acao") if isinstance(a.get("plano_de_acao"), list) else [],
            "evidencias": a.get("evidencias") if isinstance(a.get("evidencias"), list) else [],
        })

    print(f"[DEBUG] Sucesso! Retornando {len(normalized)} insights.")
    return {"analises": normalized}


# ==============================================================================
# CURVA ABC (PRODUTOS/CLIENTES) - Funções adicionais mantidas do código anterior
# ==============================================================================

def _minify_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Técnica de Compressão para Curva ABC:
    Reconhece tanto produtos quanto clientes para preencher o campo 'n' (nome).
    """
    # Tenta identificar o nome (Produto OU Cliente)
    nome = (
        item.get("nome")
        or item.get("produto")
        or item.get("clientes")
        or item.get("razao_social")
        or item.get("nome_fantasia")
        or item.get("name")
        or item.get("descricao")
        or "Item Desconhecido"
    )

    # Valores Financeiros
    valor = item.get("valor") or item.get("valor_total") or item.get("total_sold") or 0
    
    # Quantidade
    qtd = item.get("quantidade") or item.get("qty") or 0
    
    # Margem
    margem = item.get("margem") or item.get("margin")
    
    # Retorna objeto compactado
    minified = {
        "n": str(nome),
        "v": float(valor) if valor else 0,
    }
    
    if qtd:
        minified["q"] = float(qtd)
    if margem:
        minified["m"] = float(margem)
    
    return minified


def build_toon_prompt(toon_items: List[Dict[str, Any]], analysis_type: str = "produto") -> str:
    """
    Constrói o prompt para Curva ABC de Produtos ou Clientes.
    """
    print(f"[DEBUG] Iniciando minificação de {len(toon_items)} itens...")
    
    items_optimized = [_minify_item(item) for item in toon_items]
    
    if items_optimized:
        print(f"[DEBUG] Amostra Item Original: {toon_items[0] if toon_items else 'N/A'}")
        print(f"[DEBUG] Amostra Item Minificado: {items_optimized[0] if items_optimized else 'N/A'}")

    SAFE_LIMIT = 5000 
    total_items = len(items_optimized)
    
    if total_items > SAFE_LIMIT:
        head = items_optimized[:SAFE_LIMIT]
        tail = items_optimized[SAFE_LIMIT:]
        tail_value = sum(i.get("v", 0) for i in tail)
        tail_qty = sum(i.get("q", 0) for i in tail)
        
        head.append({
            "n": f"OUTROS ({len(tail)} registros de cauda longa agrupados)",
            "v": tail_value,
            "q": tail_qty,
            "note": "Agregado para analise"
        })
        
        final_data_list = head
        aviso_sistema = f"Nota: Os dados contêm {SAFE_LIMIT} itens individuais + 1 item agregado representando a cauda longa de {len(tail)} registros menores."
    else:
        final_data_list = items_optimized
        aviso_sistema = "Todos os itens foram enviados integralmente."

    print(f"[DEBUG] Selecionando Prompt para Tipo: {analysis_type.upper()}")

    if analysis_type == "clientes":
        return f"""
Você é um Consultor Expert em Gestão Comercial e Carteira de Clientes (CRM).
O usuário enviou uma Curva ABC de Clientes. Analise os dados financeiros.

IMPORTANTE: SEJA SEMPRE FIEL AOS NÚMEROS E DADOS FORNECIDOS

LEGENDA DOS DADOS (JSON Compactado):
n = Nome do Cliente / Razão Social
v = Valor Total Comprado (Receita)
q = Quantidade de Pedidos
m = Margem (se houver)

CONTEXTO DOS DADOS:
{aviso_sistema}

OBJETIVO DA ANÁLISE (BASEADO EM GESTÃO DE PROCESSOS COMERCIAIS):
Identifique padrões na carteira de clientes focando em:
1. **Concentração de Receita (Pareto):** Identifique a dependência financeira em poucos clientes (Risco de churn de grandes contas).
2. **Perfil da Carteira:** Se possível inferir pelos nomes, analise se a base é corporativa ou varejo, e se há desequilíbrio.
3. **Oportunidades e Riscos:** Analise clientes inativos ou de baixo ticket que geram alto esforço operacional vs clientes estratégicos.

SAÍDA OBRIGATÓRIA (JSON MODE):
Retorne APENAS JSON válido com a seguinte estrutura:
{{
  "analises": [
    {{
      "aspecto_avaliado": "Título curto do Insight (Ex: Alta Concentração em Top Clientes)",
      "situacao_identificada": "Descrição do cenário atual baseada nos números (Ex: Base majoritariamente B2B com Top 10 representando 60% do faturamento).",
      "riscos_associados": [
        "Risco 1 (Ex: Vulnerabilidade financeira à perda de grandes contas)",
        "Risco 2 (Ex: Esforço operacional elevado em clientes C sem retorno)"
      ],
      "plano_de_acao": [
        "Ação 1 (Ex: Criar planos de retenção VIP para classe A)",
        "Ação 2 (Ex: Automatizar atendimento para classe C ou rever precificação)"
      ],
      "evidencias": [
        {{ "tipo": "quantitativa", "detalhe": "Dado numérico (ex: Cliente X comprou $50k)" }}
      ]
    }}
  ]
}}

DADOS (TOON CLIENTES):
{json.dumps(final_data_list, ensure_ascii=False)}
""".strip()

    else:
        return f"""
Você é um Consultor Expert em Curva ABC de Produtos e Estoque.
Analise TODOS os dados de vendas de produtos fornecidos.

IMPORTANTE: SEJA SEMPRE FIEL AOS NÚMEROS E DADOS FORNECIDOS

LEGENDA DOS DADOS:
n = Nome do Produto
v = Valor Total Vendido
q = Quantidade Vendida

CONTEXTO:
{aviso_sistema}

TAREFA:
Elabore um diagnóstico profundo considerando TODA a curva (A, B e C).
1. Analise a concentração no topo (Curva A - Produtos Estrela).
2. Analise a "Cauda Longa" (Curva C) - existe oportunidade de limpeza de portfólio?
3. Identifique riscos de ruptura nos principais itens.

SAÍDA OBRIGATÓRIA (JSON MODE):
Retorne APENAS JSON válido. Estrutura:
{{
  "analises": [
    {{
      "aspecto_avaliado": "Título do Insight",
      "situacao_identificada": "Análise detalhada usando os números.",
      "riscos_associados": ["Risco 1", "Risco 2"],
      "plano_de_acao": ["Ação 1", "Ação 2"],
      "evidencias": [
        {{ "tipo": "quantitativa", "detalhe": "Dado numérico (ex: Top 10 itens = 60% da receita)" }}
      ]
    }}
  ]
}}

DADOS (TOON PRODUTOS):
{json.dumps(final_data_list, ensure_ascii=False)}
""".strip()


def gerar_insights_curva_abc_toon(toon_items: List[Dict[str, Any]], analysis_type: str = "produto") -> Dict[str, Any]:
    """
    Função principal para Curva ABC de Produtos ou Clientes.
    """
    print(f"\n[DEBUG] --- INICIANDO GERAR INSIGHTS (CURVA ABC) ---")
    print(f"[DEBUG] Analysis Type Recebido: {analysis_type}")
    print(f"[DEBUG] Total de Itens Recebidos: {len(toon_items)}")

    prompt = build_toon_prompt(toon_items, analysis_type=analysis_type)
    result = gemini_chat_json(prompt)  # Usando Gemini em vez de Mistral
    
    if "analises" not in result or not isinstance(result.get("analises"), list):
        if isinstance(result, list):
            return {"analises": result}
        return {"analises": []}

    print(f"[DEBUG] Sucesso! Retornando {len(result.get('analises', []))} insights.")
    return result