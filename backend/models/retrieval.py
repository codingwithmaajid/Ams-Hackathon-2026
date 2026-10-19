"""Retrieval tables: paragraph-level chunks with their embedding vectors.

One Chunk per cited paragraph ([P1], [P2], ...) so every retrieved passage
maps straight back to a citation an advocate can check in the file.
Vectors live in SQLite as float32 bytes and are searched with NumPy; at
demo scale (thousands of paragraphs) this is milliseconds and needs no
separate vector database.
"""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Chunk(SQLModel, table=True):
    id: str = Field(primary_key=True, description="'<doc_id>#<para>', e.g. '1042-OS-2#P2'.")
    doc_id: str = Field(foreign_key="document.id", index=True)
    case_id: str = Field(foreign_key="case.id", index=True)
    para: str | None = None
    text: str
    trusted: bool = False
    # Text that reads like an instruction to an AI (prompt injection). Kept for
    # the record, never passed to the model or spoken.
    suspicious: bool = False
    embed_model: str
    embedding: bytes
    created_at: datetime = Field(default_factory=_now)
