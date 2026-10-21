"""Post-hearing dictation and the one-tap approval queue.

- POST /cases/{id}/dictations   dictation text -> pending draft
- GET  /updates?status=pending  approval queue (all cases)
- GET  /cases/{id}/updates      drafts for one case
- GET  /updates/{id}            one draft
- POST /updates/{id}/approve    optional edits -> commits to the case record
- POST /updates/{id}/reject     discard the draft
- GET  /updates/metrics         share of drafts approved without edits
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlmodel import Session, col, select

from backend.core.db import get_session
from backend.models.cases import HearingUpdate
from backend.services.cases import find_case
from backend.services.dictation import UpdateEdits, UpdateView, approve, create_update, reject, view

router = APIRouter(tags=["Hearing updates"])

# Edited-or-not per approved draft, kept in memory for the demo metric.
_EDITED: dict[int, bool] = {}


class DictationIn(BaseModel):
    text: str = Field(min_length=5, max_length=5000)
    hearing_date: date | None = None


class Metrics(BaseModel):
    pending: int
    approved: int
    rejected: int
    approved_unedited: int
    approved_unedited_share: float | None


def _update_or_404(session: Session, update_id: int) -> HearingUpdate:
    upd = session.get(HearingUpdate, update_id)
    if upd is None:
        raise HTTPException(status_code=404, detail=f"Update {update_id} not found.")
    return upd


@router.post("/cases/{case_id}/dictations", response_model=UpdateView, status_code=201)
def dictate(case_id: str, body: DictationIn, request: Request, session: Session = Depends(get_session)) -> UpdateView:
    case = find_case(session, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")
    upd = create_update(session, case, body.text, hearing_date=body.hearing_date, llm=request.app.state.llm)
    return view(session, upd)


@router.get("/updates/metrics", response_model=Metrics)
def metrics(session: Session = Depends(get_session)) -> Metrics:
    rows = session.exec(select(HearingUpdate)).all()
    counts = {s: sum(1 for r in rows if r.status == s) for s in ("pending", "approved", "rejected")}
    unedited = sum(1 for r in rows if r.status == "approved" and not _EDITED.get(r.id, False))
    share = round(unedited / counts["approved"], 2) if counts["approved"] else None
    return Metrics(**counts, approved_unedited=unedited, approved_unedited_share=share)


@router.get("/updates", response_model=list[UpdateView])
def list_updates(status: str | None = Query(default=None, pattern="^(pending|approved|rejected)$"),
                 session: Session = Depends(get_session)) -> list[UpdateView]:
    q = select(HearingUpdate).order_by(col(HearingUpdate.created_at).desc())
    if status:
        q = q.where(HearingUpdate.status == status)
    return [view(session, u) for u in session.exec(q).all()]


@router.get("/cases/{case_id}/updates", response_model=list[UpdateView])
def case_updates(case_id: str, session: Session = Depends(get_session)) -> list[UpdateView]:
    case = find_case(session, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")
    q = select(HearingUpdate).where(HearingUpdate.case_id == case.id).order_by(col(HearingUpdate.created_at).desc())
    return [view(session, u) for u in session.exec(q).all()]


@router.get("/updates/{update_id}", response_model=UpdateView)
def get_update(update_id: int, session: Session = Depends(get_session)) -> UpdateView:
    return view(session, _update_or_404(session, update_id))


@router.post("/updates/{update_id}/approve", response_model=UpdateView)
def approve_update(update_id: int, edits: UpdateEdits | None = None,
                   session: Session = Depends(get_session)) -> UpdateView:
    upd = _update_or_404(session, update_id)
    if upd.status != "pending":
        raise HTTPException(status_code=409, detail=f"Update {update_id} is already {upd.status}.")
    _EDITED[upd.id] = approve(session, upd, edits)
    return view(session, upd)


@router.post("/updates/{update_id}/reject", response_model=UpdateView)
def reject_update(update_id: int, session: Session = Depends(get_session)) -> UpdateView:
    upd = _update_or_404(session, update_id)
    if upd.status != "pending":
        raise HTTPException(status_code=409, detail=f"Update {update_id} is already {upd.status}.")
    reject(session, upd)
    return view(session, upd)
