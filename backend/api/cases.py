"""Read-only case store API used by the dashboard."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, col, select

from backend.core.db import get_session
from backend.models.cases import Case, Document, HearingEvent, Task
from backend.services.cases import CaseBrief, DailyBrief, build_case_brief, build_daily_brief, find_case

router = APIRouter(tags=["Cases"])


def _case_or_404(session: Session, case_id: str) -> Case:
    case = find_case(session, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")
    return case


@router.get("/cases", response_model=list[Case])
def list_cases(session: Session = Depends(get_session)) -> list[Case]:
    return list(session.exec(select(Case).order_by(col(Case.next_hearing))).all())


@router.get("/cases/{case_id}", response_model=Case)
def get_case(case_id: str, session: Session = Depends(get_session)) -> Case:
    return _case_or_404(session, case_id)


@router.get("/cases/{case_id}/timeline", response_model=list[HearingEvent])
def get_timeline(case_id: str, session: Session = Depends(get_session)) -> list[HearingEvent]:
    case = _case_or_404(session, case_id)
    return list(session.exec(
        select(HearingEvent).where(HearingEvent.case_id == case.id).order_by(col(HearingEvent.event_date))
    ).all())


@router.get("/cases/{case_id}/tasks", response_model=list[Task])
def get_tasks(case_id: str, session: Session = Depends(get_session)) -> list[Task]:
    case = _case_or_404(session, case_id)
    return list(session.exec(select(Task).where(Task.case_id == case.id).order_by(col(Task.due))).all())


@router.get("/cases/{case_id}/documents", response_model=list[Document])
def get_documents(case_id: str, session: Session = Depends(get_session)) -> list[Document]:
    case = _case_or_404(session, case_id)
    return list(session.exec(select(Document).where(Document.case_id == case.id).order_by(col(Document.doc_date))).all())


@router.get("/cases/{case_id}/brief", response_model=CaseBrief)
def get_brief(case_id: str, session: Session = Depends(get_session)) -> CaseBrief:
    return build_case_brief(session, _case_or_404(session, case_id))


@router.get("/briefs/daily", response_model=DailyBrief)
def daily_brief(
    day: date | None = Query(default=None, alias="date"),
    advocate: str | None = None,
    session: Session = Depends(get_session),
) -> DailyBrief:
    return build_daily_brief(session, day=day, advocate=advocate)


# ---------------------------------------------------------------------------
# Cited Q&A and document upload (Milestone 3)
# ---------------------------------------------------------------------------

from pydantic import BaseModel, Field  # noqa: E402
from fastapi import Request  # noqa: E402

from backend.services.ingest import ingest_document  # noqa: E402
from backend.services.qa import CaseAnswer, answer_question  # noqa: E402
from backend.services.retrieval import search  # noqa: E402


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)


class DocumentUpload(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    kind: str = Field(default="note", pattern="^(order_sheet|pleading|evidence|note|correspondence)$")
    doc_date: date | None = None
    text: str = Field(min_length=1, max_length=200_000)


class UploadResult(BaseModel):
    doc_id: str
    chunks: int
    flagged_paragraphs: list[str]


class SearchHit(BaseModel):
    doc_id: str
    doc_title: str
    para: str | None
    doc_date: date | None
    text: str
    trusted: bool
    score: float


@router.post("/cases/{case_id}/ask", response_model=CaseAnswer)
def ask_case(case_id: str, body: AskRequest, request: Request, session: Session = Depends(get_session)) -> CaseAnswer:
    case = _case_or_404(session, case_id)
    return answer_question(session, case, body.question, embedder=request.app.state.embedder, llm=request.app.state.llm)


@router.get("/cases/{case_id}/search", response_model=list[SearchHit])
def search_case(case_id: str, request: Request, q: str = Query(min_length=2), k: int = Query(default=5, le=20),
                session: Session = Depends(get_session)) -> list[SearchHit]:
    case = _case_or_404(session, case_id)
    hits = search(session, request.app.state.embedder, q, case_id=case.id, k=k)
    return [SearchHit(doc_id=h.doc_id, doc_title=h.doc_title, para=h.para, doc_date=h.doc_date, text=h.text,
                      trusted=h.trusted, score=round(h.score, 4)) for h in hits]


@router.post("/cases/{case_id}/documents", response_model=UploadResult, status_code=201)
def upload_document(case_id: str, body: DocumentUpload, request: Request,
                    session: Session = Depends(get_session)) -> UploadResult:
    """Add a document to a case. Uploads are always untrusted data."""
    import uuid

    case = _case_or_404(session, case_id)
    doc = Document(id=f"{case.id}-UP-{uuid.uuid4().hex[:8]}", case_id=case.id, title=body.title, kind=body.kind,
                   doc_date=body.doc_date, text=body.text, trusted=False)
    session.add(doc)
    session.commit()
    chunks = ingest_document(session, doc, request.app.state.embedder)
    return UploadResult(doc_id=doc.id, chunks=len(chunks), flagged_paragraphs=[c.para or "" for c in chunks if c.suspicious])
