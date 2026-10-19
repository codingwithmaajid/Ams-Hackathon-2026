"""Inbound endpoints Bolna calls during and after a conversation.

- POST /bolna/webhook               execution updates (set as the agent's webhook_url)
- POST /bolna/tools/get-case-brief  custom function the voice agent calls mid-call

- POST /bolna/tools/get-daily-brief custom function for the morning brief call

Case answers come from the case store and are source-grounded. Bolna is
the voice layer; the legal reasoning stays in Jolly behind these endpoints.
"""

import hmac
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlmodel import Session

from backend.core.db import get_session

from backend.models.bolna import (
    BolnaExecutionEvent,
    CaseLookupRequest,
    CaseLookupResponse,
    DailyBriefRequest,
)
from backend.services.cases import DailyBrief, build_case_brief, build_daily_brief, find_case

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bolna", tags=["Bolna"])

# In-memory buffer of recent execution events, newest last. Replaced by
# the database once Milestone 2 lands.
RECENT_EVENTS: list[dict] = []
MAX_EVENTS = 50


def _check_secret(request: Request, header_secret: str | None, query_secret: str | None) -> None:
    expected = request.app.state.settings.bolna_webhook_secret
    if not expected:
        return
    given = header_secret or query_secret or ""
    if not hmac.compare_digest(given, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Bolna secret.")


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def execution_webhook(
    event: BolnaExecutionEvent,
    request: Request,
    x_jolly_secret: str | None = Header(default=None),
    secret: str | None = Query(default=None),
) -> dict[str, str]:
    _check_secret(request, x_jolly_secret, secret)
    logger.info("bolna execution event id=%s status=%s", event.id, event.status)

    RECENT_EVENTS.append(event.model_dump())
    del RECENT_EVENTS[:-MAX_EVENTS]

    return {"received": event.id or "unknown"}


@router.get("/executions/recent")
async def recent_executions() -> list[dict]:
    return list(reversed(RECENT_EVENTS))


@router.post("/tools/get-case-brief", response_model=CaseLookupResponse)
def get_case_brief(
    body: CaseLookupRequest,
    request: Request,
    x_jolly_secret: str | None = Header(default=None),
    secret: str | None = Query(default=None),
    session: Session = Depends(get_session),
) -> CaseLookupResponse:
    _check_secret(request, x_jolly_secret, secret)
    query = body.case_id.strip()
    case = find_case(session, query)
    if case is None:
        return CaseLookupResponse(
            case_id=query,
            found=False,
            spoken_summary=(
                f"I couldn't find a case matching {query}. "
                "Could you give me the case number or the client's name?"
            ),
        )
    brief = build_case_brief(session, case)
    return CaseLookupResponse(
        case_id=case.id,
        found=True,
        spoken_summary=brief.spoken_summary,
        citations=[line.citation.model_dump(mode="json") for line in brief.lines if line.citation],
    )


@router.post("/tools/get-daily-brief", response_model=DailyBrief)
def get_daily_brief(
    request: Request,
    body: DailyBriefRequest | None = None,
    x_jolly_secret: str | None = Header(default=None),
    secret: str | None = Query(default=None),
    session: Session = Depends(get_session),
) -> DailyBrief:
    _check_secret(request, x_jolly_secret, secret)
    body = body or DailyBriefRequest()
    return build_daily_brief(session, day=body.date, advocate=body.advocate)
