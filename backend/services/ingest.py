"""Document ingestion: split into cited paragraphs, screen, embed, store.

Paragraphs are delimited by blank lines; an optional leading marker such as
[P3] becomes the citation. Unmarked paragraphs are numbered P1..Pn so every
chunk is still citable.
"""

import re

import numpy as np
from sqlmodel import Session, select

from backend.models.cases import Document
from backend.models.retrieval import Chunk
from backend.services.embeddings import Embedder
from backend.services.guard import looks_like_injection

_MARKER = re.compile(r"^\s*\[(P\d+)\]\s*")


def split_paragraphs(text: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for i, block in enumerate(re.split(r"\n\s*\n", text.strip()), start=1):
        block = " ".join(block.split())
        if not block:
            continue
        m = _MARKER.match(block)
        para = m.group(1) if m else f"P{i}"
        body = block[m.end():] if m else block
        if body:
            out.append((para, body))
    return out


def ingest_document(session: Session, doc: Document, embedder: Embedder) -> list[Chunk]:
    for old in session.exec(select(Chunk).where(Chunk.doc_id == doc.id)).all():
        session.delete(old)
    paras = split_paragraphs(doc.text)
    if not paras:
        session.commit()
        return []
    # Give the embedder a little context: which document a paragraph is from.
    vectors = embedder.embed([f"{doc.title}. {body}" for _, body in paras])
    chunks = []
    for (para, body), vec in zip(paras, vectors):
        chunk = Chunk(
            id=f"{doc.id}#{para}", doc_id=doc.id, case_id=doc.case_id, para=para, text=body,
            trusted=doc.trusted, suspicious=looks_like_injection(body),
            embed_model=embedder.model, embedding=np.asarray(vec, dtype=np.float32).tobytes(),
        )
        session.add(chunk)
        chunks.append(chunk)
    session.commit()
    return chunks


def ensure_index(session: Session, embedder: Embedder) -> int:
    """Embed any document with no chunks, or chunks from a different model. Returns docs indexed."""
    done = 0
    for doc in session.exec(select(Document)).all():
        chunk = session.exec(select(Chunk).where(Chunk.doc_id == doc.id)).first()
        if chunk is None or chunk.embed_model != embedder.model:
            ingest_document(session, doc, embedder)
            done += 1
    return done
