"""Call placement and status routes, backed by SnapServe.

Route handlers stay thin: validation + orchestration only. Integration
details live in `backend.services.snapserve_client`.
"""

from fastapi import APIRouter, HTTPException, Request, status

from backend.models.calls import CallRequest, CallResponse, CallStatusResponse
from backend.services.snapserve_client import SnapServeClient

router = APIRouter(tags=["Calls"])


def _get_client(request: Request) -> SnapServeClient:
    return SnapServeClient(request.app.state.settings)


@router.post("/call", response_model=CallResponse, status_code=status.HTTP_200_OK)
async def trigger_call(payload: CallRequest, request: Request) -> CallResponse:
    phone = payload.phone_number.strip()

    if not phone or len(phone) < 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid phone number is required.",
        )

    client = _get_client(request)
    agent_id = payload.agent_id or 1
    data = client.place_outbound_call(agent_id, phone)

    return CallResponse(
        status=str(data.get("status", "initiated")),
        message=f"Agent call dispatched to {phone}",
        call_id=str(data.get("id")) if data.get("id") is not None else None,
    )


@router.get(
    "/call/{call_id}",
    response_model=CallStatusResponse,
    status_code=status.HTTP_200_OK,
)
async def get_call_status(call_id: str, request: Request) -> CallStatusResponse:
    client = _get_client(request)
    data = client.get_call_status(call_id)

    return CallStatusResponse(
        call_id=str(data.get("id", call_id)),
        status=str(data.get("status", "unknown")),
        duration_seconds=data.get("durationSeconds"),
        transcript=data.get("transcript"),
        error_message=data.get("errorMessage"),
    )
