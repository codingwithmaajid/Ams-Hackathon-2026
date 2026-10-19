"""Cited retrieval over a case's paragraphs (NumPy cosine + lexical boost)."""

from dataclasses import dataclass
from datetime import date

import numpy as np
from sqlmodel import Session, select

from backend.models.cases import Document
from backend.models.retrieval import Chunk
from backend.services.embeddings import Embedder, tokens


@dataclass
class Hit:
    chunk_id: str
    doc_id: str
    doc_title: str
    doc_date: date | None
    para: str | None
    text: str
    trusted: bool
    score: float


def search(
    session: Session, embedder: Embedder, query: str, *, case_id: str | None = None,
    k: int = 5, min_score: float = 0.05,
) -> list[Hit]:
    stmt = select(Chunk).where(Chunk.suspicious == False, Chunk.embed_model == embedder.model)  # noqa: E712
    if case_id:
        stmt = stmt.where(Chunk.case_id == case_id)
    chunks = session.exec(stmt).all()
    if not chunks:
        return []
    matrix = np.vstack([np.frombuffer(c.embedding, dtype=np.float32) for c in chunks])
    q = embedder.embed([query], is_query=True)[0]
    scores = matrix @ q
    qtok = set(tokens(query))
    if qtok:  # small exact-term boost helps legal jargon ("PW1", "317") survive
        for i, c in enumerate(chunks):
            overlap = len(qtok & set(tokens(c.text))) / len(qtok)
            scores[i] += 0.15 * overlap
    order = np.argsort(-scores)[:k]
    docs = {d.id: d for d in session.exec(select(Document).where(Document.id.in_({chunks[i].doc_id for i in order}))).all()}
    hits = []
    for i in order:
        if scores[i] < min_score:
            continue
        c = chunks[i]
        d = docs.get(c.doc_id)
        hits.append(Hit(c.id, c.doc_id, d.title if d else c.doc_id, d.doc_date if d else None,
                        c.para, c.text, c.trusted, float(scores[i])))
    return hits


def with_neighbours(session: Session, hits: list[Hit], top_n: int = 1) -> list[Hit]:
    """Add the paragraphs either side of the best hits from the same document.

    Order sheets read as a sequence ("accused absent" / "last chance" /
    "adjourned to"), so a single paragraph often lacks the reason.
    """
    seen = {h.chunk_id for h in hits}
    extra: list[Hit] = []
    for h in hits[:top_n]:
        if not h.para or not h.para[1:].isdigit():
            continue
        n = int(h.para[1:])
        for m in (n - 1, n + 1):
            cid = f"{h.doc_id}#P{m}"
            if cid in seen or m < 1:
                continue
            c = session.get(Chunk, cid)
            if c is None or c.suspicious:
                continue
            seen.add(cid)
            extra.append(Hit(c.id, c.doc_id, h.doc_title, h.doc_date, c.para, c.text, c.trusted, h.score * 0.9))
    merged = hits[:top_n] + extra + hits[top_n:]
    return merged
