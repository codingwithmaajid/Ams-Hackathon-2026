import requests
from fastapi import APIRouter, Request

from backend.services.embeddings import GEMINI_BASE, HashingEmbedder

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "jolly-backend",
    }


@router.get("/health/llm")
def llm_health(request: Request, probe: bool = False) -> dict:
    """Which Gemini model Jolly is really using, and why it fell back if it did.

    `?probe=true` spends one small request per model to find the first one
    that answers, and lists the generate/embedding models the key can see.
    Never returns the key itself.
    """
    llm = request.app.state.llm
    embedder = request.app.state.embedder
    out: dict = {
        "llm_configured": llm is not None,
        "embedder": getattr(embedder, "model", "unknown"),
        "embedder_offline": isinstance(embedder, HashingEmbedder),
    }
    if llm is None:
        return out
    if probe:
        try:
            resp = requests.get(f"{GEMINI_BASE}/models", headers={"x-goog-api-key": llm.api_key},
                                params={"pageSize": 200}, timeout=15)
            names = [m["name"].removeprefix("models/") for m in resp.json().get("models", [])] if resp.ok else []
            out["key_ok"] = resp.ok
            out["available_flash"] = sorted(n for n in names if "flash" in n)[:30]
            out["available_embedding"] = sorted(n for n in names if "embedding" in n)
        except requests.RequestException as exc:
            out["key_ok"] = False
            out["probe_error"] = type(exc).__name__
        try:
            llm.generate_json("Reply with JSON only.", 'Return {"ok": true}')
        except Exception:  # noqa: BLE001 - status() carries the reason
            pass
    out.update(llm.status())
    return out
