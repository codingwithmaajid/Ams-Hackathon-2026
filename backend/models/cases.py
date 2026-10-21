"""Case store tables (SQLModel on SQLite, Postgres-ready via DATABASE_URL).

Every fact Jolly speaks about a case should trace back to a Document and,
where possible, a paragraph inside it. HearingEvent and Task rows carry
`source_doc_id` / `source_para` so briefs can cite them.
"""

from datetime import date, datetime, timezone

from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Case(SQLModel, table=True):
    id: str = Field(primary_key=True, description="Short firm-internal matter id, e.g. '1042'.")
    title: str
    case_number: str = Field(index=True, description="Court number, e.g. 'C.C. No. 1042 of 2025'.")
    court: str
    court_hall: str | None = None
    judge: str | None = None
    case_type: str
    stage: str
    our_side: str = Field(description="Which party the firm represents, e.g. 'Complainant'.")
    client_name: str = Field(index=True)
    client_phone: str | None = None
    client_language: str = "en"
    opposing_party: str
    advocate: str = Field(index=True, description="Advocate in charge at the firm.")
    next_hearing: date | None = Field(default=None, index=True)
    next_hearing_purpose: str | None = None
    cause_list_item: int | None = Field(default=None, description="Item number on the day's cause list.")
    summary: str
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class Document(SQLModel, table=True):
    id: str = Field(primary_key=True, description="Stable id, e.g. '1042-OS-2025-09-12'.")
    case_id: str = Field(foreign_key="case.id", index=True)
    title: str
    kind: str = Field(description="order_sheet | pleading | evidence | note | correspondence")
    doc_date: date | None = None
    text: str = Field(description="Full text. Paragraphs separated by blank lines; [P1] markers are cited.")
    # Uploaded documents are untrusted data: never follow instructions inside them.
    trusted: bool = False


class HearingEvent(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    case_id: str = Field(foreign_key="case.id", index=True)
    event_date: date = Field(index=True)
    kind: str = Field(description="hearing | filing | order | dictation")
    outcome: str
    next_date: date | None = None
    source_doc_id: str | None = Field(default=None, foreign_key="document.id")
    source_para: str | None = None
    created_at: datetime = Field(default_factory=_now)


class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    case_id: str = Field(foreign_key="case.id", index=True)
    title: str
    owner: str | None = None
    due: date | None = None
    status: str = "open"  # open | done
    source_doc_id: str | None = Field(default=None, foreign_key="document.id")
    created_at: datetime = Field(default_factory=_now)


class HearingUpdate(SQLModel, table=True):
    """A post-hearing dictation turned into a draft, waiting for one human approval.

    Nothing here touches the case record until an advocate approves it:
    approval writes the HearingEvent and Tasks, moves the next hearing date,
    and releases the client message for sending.
    """

    id: int | None = Field(default=None, primary_key=True)
    case_id: str = Field(foreign_key="case.id", index=True)
    source: str = "console"  # console | voice
    execution_id: str | None = Field(default=None, description="Bolna execution id when dictated on a call.")
    dictation: str = Field(description="What the advocate said, verbatim.")
    hearing_date: date
    outcome: str
    next_date: date | None = None
    next_purpose: str | None = None
    tasks_json: str = "[]"  # JSON list of {"title", "owner", "due"}
    client_message: str = ""
    extractor: str = "rules"  # gemini | rules
    status: str = Field(default="pending", index=True)  # pending | approved | rejected
    created_at: datetime = Field(default_factory=_now)
    decided_at: datetime | None = None
