"""Обёртка над LLM: один метод, тайм-аут, классификация ошибок в коды ai_error.

- `anthropic` — через официальный SDK Anthropic.
- Любой другой провайдер — через OpenAI-совместимый API (/chat/completions):
  OpenAI, OpenRouter, DeepSeek, Gemini, Mistral, Groq, Ollama или свой адрес в LLM_BASE_URL.
"""

import logging
from typing import Any, Protocol

import anthropic
import httpx

from app.config import Settings

logger = logging.getLogger(__name__)

MAX_TOKENS = 8000
RATE_LIMIT_PAUSE_CAP_SECONDS = 3.0
PROVIDER_ERROR_PAUSE_SECONDS = 1.0


class AIError(Exception):
    """Ошибка ИИ с кодом из таблицы CLAUDE.md. `retry` — стоит ли повторить один раз, `pause` — сколько ждать."""

    def __init__(self, code: str, detail: str = "", *, retry: bool = False, pause: float = 0.0):
        super().__init__(f"{code}: {detail}" if detail else code)
        self.code = code
        self.retry = retry
        self.pause = pause


class LLMClient(Protocol):
    name: str

    async def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> str:
        """Возвращает JSON-строку по схеме или бросает AIError."""
        ...

    async def close(self) -> None: ...


def _retry_after(error: anthropic.APIStatusError) -> float:
    try:
        value = float(error.response.headers.get("retry-after", "1"))
    except ValueError:
        value = 1.0
    return min(max(value, 0.0), RATE_LIMIT_PAUSE_CAP_SECONDS)


class AnthropicClient:
    name = "anthropic"

    def __init__(self, api_key: str, model: str, timeout: float, effort: str | None, base_url: str | None = None):
        # Повторы делаем сами (не больше одного), поэтому у SDK они выключены.
        self._client = anthropic.AsyncAnthropic(api_key=api_key, base_url=base_url, timeout=timeout, max_retries=0)
        self._model = model
        self._effort = effort

    async def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> str:
        output_config: dict[str, Any] = {"format": {"type": "json_schema", "schema": schema}}
        if self._effort:
            output_config["effort"] = self._effort

        try:
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=MAX_TOKENS,
                system=system,
                messages=[{"role": "user", "content": user}],
                output_config=output_config,
            )
        except anthropic.APITimeoutError as error:
            raise AIError("timeout", retry=True) from error
        except anthropic.APIConnectionError as error:
            raise AIError("network_error", retry=True) from error
        except anthropic.RateLimitError as error:
            raise AIError("rate_limited", retry=True, pause=_retry_after(error)) from error
        except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as error:
            raise AIError("auth_error", f"status {error.status_code}") from error
        except anthropic.APIStatusError as error:
            if error.status_code == 402 or getattr(error, "type", None) == "billing_error":
                raise AIError("billing_error", f"status {error.status_code}") from error
            if error.status_code >= 500:
                raise AIError(
                    "provider_error", f"status {error.status_code}", retry=True, pause=PROVIDER_ERROR_PAUSE_SECONDS
                ) from error
            # 400/404 и т.п.: неверная модель или запрос — повтор не поможет.
            raise AIError("provider_error", f"status {error.status_code} {error.message}") from error

        if response.stop_reason in ("max_tokens", "refusal"):
            raise AIError("invalid_json", f"stop_reason={response.stop_reason}", retry=True)

        text = next((block.text for block in response.content if block.type == "text"), None)
        if not text:
            raise AIError("invalid_json", "no text block", retry=True)
        return text

    async def close(self) -> None:
        await self._client.close()


# Адреса OpenAI-совместимых API по умолчанию. LLM_BASE_URL перекрывает их.
OPENAI_COMPATIBLE_URLS = {
    "openai": "https://api.openai.com/v1",
    "openrouter": "https://openrouter.ai/api/v1",
    "deepseek": "https://api.deepseek.com/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai",
    "mistral": "https://api.mistral.ai/v1",
    "groq": "https://api.groq.com/openai/v1",
    "ollama": "http://localhost:11434/v1",
}


class OpenAICompatibleClient:
    def __init__(self, name: str, api_key: str, model: str, base_url: str, timeout: float):
        self.name = name
        self._model = model
        self._url = f"{base_url.rstrip('/')}/chat/completions"
        self._http = httpx.AsyncClient(timeout=timeout, headers={"Authorization": f"Bearer {api_key}"})

    async def complete_json(self, system: str, user: str, schema: dict[str, Any]) -> str:
        payload = {
            "model": self._model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "decision", "strict": True, "schema": schema},
            },
        }

        try:
            response = await self._http.post(self._url, json=payload)
        except httpx.TimeoutException as error:
            raise AIError("timeout", retry=True) from error
        except httpx.TransportError as error:
            raise AIError("network_error", retry=True) from error

        status = response.status_code
        if status >= 400:
            error_code = _error_code(response)
            if status == 402 or error_code == "insufficient_quota":
                raise AIError("billing_error", f"status {status}")
            if status in (401, 403):
                raise AIError("auth_error", f"status {status}")
            if status == 429:
                pause = min(_float_header(response, "retry-after"), RATE_LIMIT_PAUSE_CAP_SECONDS)
                raise AIError("rate_limited", retry=True, pause=pause)
            if status >= 500:
                raise AIError("provider_error", f"status {status}", retry=True, pause=PROVIDER_ERROR_PAUSE_SECONDS)
            raise AIError("provider_error", f"status {status} {error_code or ''}".strip())

        try:
            choice = response.json()["choices"][0]
            message = choice["message"]
        except (ValueError, KeyError, IndexError, TypeError) as error:
            raise AIError("invalid_json", "unexpected response shape", retry=True) from error

        if choice.get("finish_reason") == "length" or message.get("refusal"):
            raise AIError("invalid_json", f"finish_reason={choice.get('finish_reason')}", retry=True)

        text = message.get("content")
        if not text:
            raise AIError("invalid_json", "empty content", retry=True)
        return text

    async def close(self) -> None:
        await self._http.aclose()


def _error_code(response: httpx.Response) -> str | None:
    try:
        error = response.json().get("error")
    except ValueError:
        return None
    if isinstance(error, dict):
        return error.get("code") or error.get("type")
    return None


def _float_header(response: httpx.Response, name: str) -> float:
    try:
        return max(float(response.headers.get(name, "1")), 0.0)
    except ValueError:
        return 1.0


def build_client(settings: Settings) -> LLMClient | None:
    """None → ИИ не настроен (ai_error=not_configured)."""
    if not settings.llm_api_key:
        return None

    if settings.llm_provider == "anthropic":
        return AnthropicClient(
            api_key=settings.llm_api_key,
            model=settings.llm_model,
            timeout=settings.ai_timeout_seconds,
            effort=settings.llm_effort,
            base_url=settings.llm_base_url,
        )

    base_url = settings.llm_base_url or OPENAI_COMPATIBLE_URLS.get(settings.llm_provider)
    if base_url is None:
        logger.warning("LLM_PROVIDER=%s: unknown provider and no LLM_BASE_URL, AI disabled", settings.llm_provider)
        return None

    return OpenAICompatibleClient(
        name=settings.llm_provider,
        api_key=settings.llm_api_key,
        model=settings.llm_model,
        base_url=base_url,
        timeout=settings.ai_timeout_seconds,
    )
