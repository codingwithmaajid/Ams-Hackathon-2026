"""Text embeddings.

- GeminiEmbedder: Google AI Studio free tier (`gemini-embedding-2`), used
  when EMBEDDING_API_KEY is set.
- HashingEmbedder: deterministic, offline, zero-cost fallback (hashed word
  and bigram features). Keeps tests, CI and demos working with no key.

Both return L2-normalised float32 vectors so cosine similarity is a dot product.
"""

import hashlib
import logging
import re
from typing import Protocol

import numpy as np
import requests

logger = logging.getLogger(__name__)

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"
_STOP = frozenset(
    "a an the of to in on for and or is was were be been by with at as it this that from "
    "what why when who how did does do which are has have had will shall".split()
)


class Embedder(Protocol):
    model: str

    def embed(self, texts: list[str], *, is_query: bool = False) -> np.ndarray: ...


def _normalise(m: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(m, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return (m / norms).astype(np.float32)


def tokens(text: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", text.lower())
    out = []
    for w in words:
        if w in _STOP:
            continue
        # crude stemming so 'adjourned' ~ 'adjournment' ~ 'adjourn'
        for suf in ("ment", "ing", "ed", "es", "s"):
            if len(w) > len(suf) + 3 and w.endswith(suf):
                w = w[: -len(suf)]
                break
        out.append(w)
    return out


class HashingEmbedder:
    model = "local-hash-v1"

    def __init__(self, dim: int = 1024):
        self.dim = dim

    def _bucket(self, feat: str) -> tuple[int, float]:
        h = hashlib.blake2b(feat.encode(), digest_size=8).digest()
        n = int.from_bytes(h, "little")
        return n % self.dim, (1.0 if (n >> 63) & 1 else -1.0)

    def embed(self, texts: list[str], *, is_query: bool = False) -> np.ndarray:
        m = np.zeros((len(texts), self.dim), dtype=np.float32)
        for i, t in enumerate(texts):
            toks = tokens(t)
            feats = toks + [f"{a}_{b}" for a, b in zip(toks, toks[1:])]
            for f in feats:
                j, sign = self._bucket(f)
                m[i, j] += sign
        return _normalise(m)


class GeminiEmbedder:
    def __init__(self, api_key: str, model: str = "gemini-embedding-2", timeout: float = 20.0):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    def embed(self, texts: list[str], *, is_query: bool = False) -> np.ndarray:
        task = "RETRIEVAL_QUERY" if is_query else "RETRIEVAL_DOCUMENT"
        vectors: list[list[float]] = []
        for start in range(0, len(texts), 100):
            batch = texts[start : start + 100]
            resp = requests.post(
                f"{GEMINI_BASE}/models/{self.model}:batchEmbedContents",
                headers={"x-goog-api-key": self.api_key},
                json={
                    "requests": [
                        {"model": f"models/{self.model}", "content": {"parts": [{"text": t}]}, "taskType": task}
                        for t in batch
                    ]
                },
                timeout=self.timeout,
            )
            resp.raise_for_status()
            vectors += [e["values"] for e in resp.json()["embeddings"]]
        return _normalise(np.array(vectors, dtype=np.float32))


def get_embedder(settings) -> Embedder:
    if settings.embedding_api_key:
        return GeminiEmbedder(settings.embedding_api_key, model=settings.embedding_model)
    return HashingEmbedder()
