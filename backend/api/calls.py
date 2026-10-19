"""Call placement and status routes, backed by Bolna.

Route handlers stay thin: validation + orchestration only. Integration
details live in `backend.services.bolna_client`.
"""

import re

from fastapi import APIRouter, HTTPException, Request, status

from backend.models.calls import CallRequest, CallResponse, CallStatusResponse
from backend.services.bolna_client import TERMINAL_STATUSES, BolnaClient

router = APIRouter(tags=["Calls"])

E164 = re.compile(r"^\+[1-9]\d{6,14}$")


def _get_client(request: Request) -> BolnaClient:
    return BolnaClient(request.app.state.settings)


@router.post("/call", response_model=CallResponse, status_code=status.HTTP_200_OK)
async def trigger_call(payload: CallRequest, request: Request) -> CallResponse:
    phone = re.sub(r"[\s-]", "", payload.phone_number or "")

    if not E164.match(phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid phone number in E.164 format (e.g. +919876543210) is required.",
        )

    client = _get_client(request)
    data = client.place_call(phone, agent_id=payload.agent_id, user_data=payload.user_data)

    return CallResponse(
        status=str(data.get("status", "queued")),
        message=f"Jolly is calling {phone}",
        call_id=data.get("execution_id"),
    )


@router.get(
    "/call/{call_id}",
    response_model=CallStatusResponse,
    status_code=status.HTTP_200_OK,
)
async def get_call_status(call_id: str, request: Request) -> CallStatusResponse:
    client = _get_client(request)
    data = client.get_execution(call_id)
    call_status = str(data.get("status", "unknown"))
    telephony = data.get("telephony_data") or {}

    return CallStatusResponse(
        call_id=str(data.get("id", call_id)),
        status=call_status,
        is_terminal=call_status in TERMINAL_STATUSES,
        duration_seconds=data.get("conversation_duration"),
        transcript=data.get("transcript"),
        summary=data.get("summary"),
        recording_url=telephony.get("recording_url"),
        error_message=data.get("error_message"),
    )
