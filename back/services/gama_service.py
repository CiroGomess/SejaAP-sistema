# gama_service.py
import os
import time
import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

import requests
from dotenv import load_dotenv

# Configuração de logging para debug
logger = logging.getLogger(__name__)


class GamaServiceError(RuntimeError):
    pass


@dataclass
class GamaGenerationResult:
    generation_id: str
    status: str
    gamma_url: Optional[str] = None
    export_url: Optional[str] = None
    export_type: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


class GamaService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://public-api.gamma.app/v1.0",
        timeout_s: int = 60,
    ):
        load_dotenv()
        self.api_key = api_key or os.getenv("GAMA_API_KEY")
        if not self.api_key:
            raise GamaServiceError("GAMA_API_KEY não encontrada no .env")

        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s

        self.session = requests.Session()
        self.session.headers.update(
            {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-API-KEY": self.api_key,
            }
        )

    # ======================================================================
    # ✅ NOVO: CONCATENAÇÃO SEGURA (SEM INVENTAR DADOS)
    # ======================================================================
    def concat_source_data_into_payload(
        self,
        payload: Dict[str, Any],
        source_data: Dict[str, Any],
        extra_instructions: Optional[str] = None,
        prompt_keys: Tuple[str, ...] = ("prompt", "content", "input", "instructions", "text"),
    ) -> Dict[str, Any]:
        """
        Concatena um bloco de "DADOS_OFICIAIS (JSON)" + regras de não-invenção
        no campo de texto do payload (prompt/content/input/...).

        ✅ Uso:
            payload = gama.concat_source_data_into_payload(payload, source_data)
            generation_id = gama.create_generation(payload)

        - Não muda seu fluxo atual: você continua montando payload como já faz.
        - Só garante que os dados reais vão juntos.
        """

        if not isinstance(payload, dict):
            raise GamaServiceError("payload inválido (não é dict).")
        if not isinstance(source_data, dict):
            raise GamaServiceError("source_data inválido (não é dict).")

        # 1) Descobrir qual chave do payload contém o texto principal
        target_key = None
        for k in prompt_keys:
            if isinstance(payload.get(k), str) and payload.get(k).strip():
                target_key = k
                break

        # Se não achar nenhuma, cria em "prompt" (padrão)
        if not target_key:
            target_key = "prompt"
            payload[target_key] = ""

        # 2) Serializar JSON oficial
        source_json = json.dumps(source_data, ensure_ascii=False, indent=2)

        # 3) Guardrails (evita inventar número)
        guardrails = """
REGRAS CRÍTICAS (OBRIGATÓRIO):
- Use SOMENTE os dados do bloco "DADOS_OFICIAIS (JSON)" abaixo.
- É PROIBIDO inventar números, percentuais, quantidades, valores, rankings ou variações.
- Se algum dado necessário não existir no JSON, escreva literalmente: "Dado não disponível".
- Não faça estimativas, não crie exemplos numéricos, não arredonde fora do necessário.
""".strip()

        # 4) Montar concat final
        append_block = "\n\n" + guardrails + "\n\nDADOS_OFICIAIS (JSON):\n" + source_json

        if extra_instructions and str(extra_instructions).strip():
            append_block += "\n\nINSTRUÇÕES EXTRAS:\n" + str(extra_instructions).strip()

        # 5) Concatenar no texto existente (preservando o que já existe)
        payload[target_key] = (payload.get(target_key, "") or "").rstrip() + append_block

        logger.info("Concatenação aplicada no payload em key='%s' (DADOS_OFICIAIS anexado).", target_key)
        return payload

    # ======================================================================

    def get_theme_id_by_name(self, theme_name: str) -> Optional[str]:
        """
        Consulta a API para encontrar o ID de um tema dado seu nome (ex: 'Oasis').
        Retorna o ID (str) se encontrar, ou None se não existir.
        """
        if not theme_name:
            return None

        url = f"{self.base_url}/themes"
        params = {
            "query": theme_name,  # Filtra pelo nome (case-insensitive)
            "limit": 1,           # Só precisamos do primeiro match
        }

        try:
            resp = self.session.get(url, params=params, timeout=self.timeout_s)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                if data:
                    # Retorna o ID do primeiro tema encontrado
                    found_id = data[0].get("id")
                    logger.info(f"Tema '{theme_name}' resolvido para ID: {found_id}")
                    return found_id

            logger.warning(f"Tema '{theme_name}' não encontrado ou erro na busca. Status: {resp.status_code}")
            return None

        except requests.RequestException as e:
            logger.error(f"Erro de conexão ao buscar tema: {e}")
            return None

    def create_generation(self, payload: Dict[str, Any]) -> str:
        url = f"{self.base_url}/generations"
        resp = self.session.post(url, json=payload, timeout=self.timeout_s)

        if resp.status_code >= 400:
            raise self._err(resp)

        data = resp.json()
        generation_id = data.get("id") or data.get("generationId") or data.get("data", {}).get("id")
        if not generation_id:
            raise GamaServiceError(f"Resposta sem id de geração. Body: {data}")
        return generation_id

    def get_generation(self, generation_id: str) -> GamaGenerationResult:
        url = f"{self.base_url}/generations/{generation_id}"
        resp = self.session.get(url, timeout=self.timeout_s)
        if resp.status_code >= 400:
            raise self._err(resp)

        data = resp.json()
        status = data.get("status") or data.get("data", {}).get("status") or "unknown"

        gamma_url = (
            data.get("gammaUrl")
            or data.get("url")
            or data.get("data", {}).get("gammaUrl")
            or data.get("data", {}).get("url")
        )

        export_url = (
            data.get("exportUrl")
            or data.get("exportedFileUrl")
            or data.get("data", {}).get("exportUrl")
            or data.get("data", {}).get("exportedFileUrl")
        )

        export_type = (
            data.get("exportAs")
            or data.get("exportType")
            or data.get("data", {}).get("exportAs")
            or data.get("data", {}).get("exportType")
        )

        if not export_url:
            exports = data.get("exports") or data.get("data", {}).get("exports")
            if isinstance(exports, list) and exports:
                export_url = exports[0].get("url") or exports[0].get("exportUrl")
                export_type = export_type or exports[0].get("type")

        return GamaGenerationResult(
            generation_id=generation_id,
            status=status,
            gamma_url=gamma_url,
            export_url=export_url,
            export_type=export_type,
            raw=data,
        )

    def wait_until_completed(
        self,
        generation_id: str,
        poll_interval_s: float = 2.0,
        max_wait_s: int = 300,
    ) -> GamaGenerationResult:
        deadline = time.time() + max_wait_s
        last: Optional[GamaGenerationResult] = None

        while time.time() < deadline:
            last = self.get_generation(generation_id)
            st = (last.status or "").lower()

            if st in ("completed", "complete", "done"):
                return last
            if st in ("failed", "error", "canceled", "cancelled"):
                raise GamaServiceError(f"Geração falhou (status={last.status}). Detalhes: {last.raw}")

            time.sleep(poll_interval_s)

        raise GamaServiceError(
            f"Timeout aguardando completar (max_wait_s={max_wait_s}). Último status: {last.status if last else 'n/a'}"
        )

    def download_export(self, export_url: str, output_path: str) -> str:
        if not export_url:
            raise GamaServiceError("export_url vazio (nenhum arquivo para baixar).")

        resp = self.session.get(export_url, timeout=self.timeout_s, stream=True)
        if resp.status_code >= 400:
            raise self._err(resp)

        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

        with open(output_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)

        return output_path

    def _err(self, resp: requests.Response) -> GamaServiceError:
        try:
            data = resp.json()
        except Exception:
            data = {"text": resp.text}
        msg = data.get("message") or data.get("error") or data.get("text") or str(data)
        return GamaServiceError(f"Gama API error HTTP {resp.status_code}: {msg}")
