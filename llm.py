"""Talks to the local Ollama server over HTTP (http://localhost:11434 by default)."""
import httpx

from config import settings


class LLMUnavailable(Exception):
    """Raised when Ollama is not running or the model is not installed."""


def chat(messages: list[dict]) -> str:
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {"temperature": settings.LLM_TEMPERATURE},
    }
    try:
        resp = httpx.post(f"{settings.OLLAMA_URL}/api/chat", json=payload, timeout=settings.LLM_TIMEOUT_SECONDS)
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise LLMUnavailable(f"Cannot reach Ollama at {settings.OLLAMA_URL}: {exc}") from exc
    if resp.status_code == 404:
        raise LLMUnavailable(f"Model '{settings.OLLAMA_MODEL}' not found. Run: ollama pull {settings.OLLAMA_MODEL}")
    if resp.status_code != 200:
        raise LLMUnavailable(f"Ollama returned HTTP {resp.status_code}")
    return resp.json().get("message", {}).get("content", "").strip()


def is_available() -> bool:
    try:
        r = httpx.get(f"{settings.OLLAMA_URL}/api/tags", timeout=3)
        if r.status_code != 200:
            return False
        names = [m.get("name", "") for m in r.json().get("models", [])]
        return any(n.split(":")[0] == settings.OLLAMA_MODEL.split(":")[0] for n in names)
    except httpx.HTTPError:
        return False
