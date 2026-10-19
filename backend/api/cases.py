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
