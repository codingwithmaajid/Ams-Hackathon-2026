"""Inbound endpoints Bolna calls during and after a conversation.

- POST /bolna/webhook               execution updates (set as the agent's webhook_url)
- POST /bolna/tools/get-case-brief  custom function the voice agent calls mid-call

Scaffolding only: the case tool returns a placeholder until the case
store and brief generator land. Bolna is the voice layer; the legal
reasoning stays in Jolly's own agent behind these endpoints.
"""

import hmac
import logging

from fastapi import APIRouter, Header, HTTPException, Query, Request, status

from backend.models.bolna import (
    BolnaExecutionEvent,
    CaseLookupRequest,
    CaseLookupResponse,
)

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
async def get_case_brief(
    body: CaseLookupRequest,
    request: Request,
    x_jolly_secret: str | None = Header(default=None),
    secret: str | None = Query(default=None),
) -> CaseLookupResponse:
    _check_secret(request, x_jolly_secret, secret)
    case_id = body.case_id.strip()

    # TODO(milestone-3): look up the case and return the source-grounded brief.
    return CaseLookupResponse(
        case_id=case_id,
        found=False,
        spoken_summary=(
            f"I don't have case {case_id} loaded yet. "
            "Case briefs are coming in the next build."
        ),
    )
