import os
import json
import re
from typing import Any, Dict, List, Optional, Union
from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Modelos disponíveis: gemini-2.0-flash-exp, gemini-1.5-flash, gemini-1.5-pro, gemini-3-flash-preview
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
GEMINI_TIMEOUT_SECONDS = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "120"))  # Timeout maior


class MistralServiceError(Exception):
    pass


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
    except:
        return None


def _extract_json(text: str) -> Dict[str, Any]:
    # (Mantém a mesma lógica robusta de extração da versão anterior)
    raw = (text or "").strip()
    cleaned = _strip_code_fences(raw).strip()
    parsed = _try_json_loads(cleaned)

    if parsed is None:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1:
            parsed = _try_json_loads(cleaned[start : end + 1])

    if parsed is None:
        sample = cleaned[:500]
        # [DEBUG] Log de erro caso falhe o JSON
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


def _minify_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Técnica de Compressão Atualizada:
    Reconhece tanto produtos quanto clientes para preencher o campo 'n' (nome).
    Isso permite enviar MUITO mais dados no mesmo limite de tokens.
    """
    # CORREÇÃO: Extrair o nome corretamente do campo 'nome' que aparece no log
    nome = (
        item.get("nome")  # Primeiro tenta 'nome' que é o campo que aparece no log
        or item.get("produto")
        or item.get("clientes")  # Caso seja análise de cliente
        or item.get("razao_social")  # Caso seja análise de cliente
        or item.get("nome_fantasia")  # Caso seja análise de cliente
        or item.get("name")
        or item.get("descricao")
        or "Item Desconhecido"
    )

    # CORREÇÃO: Extrair valor corretamente do campo 'valor' que aparece no log
    valor = item.get("valor") or item.get("valor_total") or item.get("total_sold") or 0

    # 3. Quantidade - pode não estar presente nos dados de produto
    qtd = item.get("quantidade") or item.get("qty") or 0

    # 4. Margem
    margem = item.get("margem") or item.get("margin")  # Se tiver

    # Retorna objeto compactado
    minified = {
        "n": str(nome),  # n = nome
        "v": float(valor) if valor else 0,  # v = valor
    }

    # Só adiciona qtd e margem se existirem para economizar token
    if qtd:
        minified["q"] = float(qtd)
    if margem:
        minified["m"] = float(margem)

    return minified


def build_toon_prompt(
    toon_items: List[Dict[str, Any]], analysis_type: str = "produto"
) -> str:
    """
    Constrói o prompt enviando TUDO, mas com inteligência de dados.
    Aceita 'analysis_type' para decidir se o foco é Produto ou Cliente.
    """

    # [DEBUG] Verificar minificação
    print(f"[DEBUG] Iniciando minificação de {len(toon_items)} itens...")

    # 1. OTIMIZAÇÃO: Compacta os dados
    items_optimized = [_minify_item(item) for item in toon_items]

    if items_optimized:
        print(f"[DEBUG] Amostra Item Original: {toon_items[0]}")
        print(f"[DEBUG] Amostra Item Minificado: {items_optimized[0]}")

    # 2. SEGURANÇA: Limite do Gemini (~32k tokens)
    SAFE_LIMIT = 5000

    total_items = len(items_optimized)

    if total_items > SAFE_LIMIT:
        # Pega os Top SAFE_LIMIT
        head = items_optimized[:SAFE_LIMIT]

        # Soma o resto (Cauda)
        tail = items_optimized[SAFE_LIMIT:]
        tail_value = sum(i.get("v", 0) for i in tail)
        tail_qty = sum(i.get("q", 0) for i in tail)

        # Adiciona o item agregado
        head.append(
            {
                "n": f"OUTROS ({len(tail)} registros de cauda longa agrupados)",
                "v": tail_value,
                "q": tail_qty,
                "note": "Agregado para analise",
            }
        )

        final_data_list = head
        aviso_sistema = f"Nota: Os dados contêm {SAFE_LIMIT} itens individuais + 1 item agregado representando a cauda longa de {len(tail)} registros menores."
    else:
        final_data_list = items_optimized
        aviso_sistema = "Todos os itens foram enviados integralmente."

    # --- SELEÇÃO DE PROMPTS ---

    print(f"[DEBUG] Selecionando Prompt para Tipo: {analysis_type.upper()}")

    if analysis_type == "clientes":
        # === PROMPT PARA CLIENTES (Gestão Comercial / CRM) ===
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
        # === PROMPT PARA PRODUTOS (Gestão de Estoque / Padrão) ===
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


def gemini_chat_json(prompt: str) -> Dict[str, Any]:
    """
    Usa a biblioteca oficial google-generativeai para gerar conteúdo com Gemini
    """
    if not GEMINI_API_KEY:
        raise MistralServiceError("GEMINI_API_KEY não configurada.")

    try:
        # Inicializa o cliente com a chave da API
        client = genai.Client(api_key=GEMINI_API_KEY)

        print(f"[DEBUG] Enviando requisição para Gemini (modelo: {GEMINI_MODEL})...")

        # Configuração para gerar conteúdo com JSON
        config = types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=8192,
            response_mime_type="application/json",
        )

        # Faz a chamada à API
        response = client.models.generate_content(
            model=GEMINI_MODEL, contents=[prompt], config=config
        )

        print(f"[DEBUG] Resposta recebida com sucesso!")

        # Extrai o texto da resposta
        if response and response.text:
            print(f"[DEBUG] Resposta (primeiros 200 chars): {response.text[:200]}...")
            return _extract_json(response.text)
        else:
            raise MistralServiceError("Resposta vazia da API Gemini")

    except Exception as e:
        print(f"[DEBUG] Erro na chamada Gemini: {str(e)}")
        raise MistralServiceError(f"Erro na API Gemini: {str(e)}")


def gerar_insights_curva_abc_toon(
    toon_items: List[Dict[str, Any]], analysis_type: str = "produto"
) -> Dict[str, Any]:
    """
    Função principal.
    Agora aceita analysis_type para direcionar o prompt correto (produto ou cliente).
    """
    print(f"\n[DEBUG] --- INICIANDO GERAR INSIGHTS ---")
    print(f"[DEBUG] Analysis Type Recebido: {analysis_type}")
    print(f"[DEBUG] Total de Itens Recebidos: {len(toon_items)}")

    prompt = build_toon_prompt(toon_items, analysis_type=analysis_type)
    result = gemini_chat_json(prompt)

    if "analises" not in result or not isinstance(result.get("analises"), list):
        if isinstance(result, list):
            return {"analises": result}
        return {"analises": []}

    print(f"[DEBUG] Sucesso! Retornando {len(result.get('analises', []))} insights.")
    return result