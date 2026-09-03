import requests
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from backend.core.config import Settings

router = APIRouter(tags=["Calls"])


class CallRequest(BaseModel):
    phone_number: str = Field(
        ...,
        json_schema_extra={"example": "+1234567890"},
    )
    agent_id: int | None = 1


class CallResponse(BaseModel):
    status: str
    message: str
    call_id: str | None = None


def _get_settings(request: Request) -> Settings:
    return request.app.state.settings


def _build_auth_headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _resolve_from_number(settings: Settings, agent_id: int) -> str:
    if settings.snapserve_from_number and settings.snapserve_from_number.strip():
        return settings.snapserve_from_number.strip()

    response = requests.get(
        f"{settings.snapserve_base_url}/phone-numbers",
        headers=_build_auth_headers(settings.snapserve_api_key or ""),
        timeout=20,
    )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch SnapServe phone numbers.",
        )

    phone_numbers = response.json()
    for number in phone_numbers:
        if number.get("agentId") == agent_id and number.get("number"):
            return str(number["number"])

    if phone_numbers and phone_numbers[0].get("number"):
        return str(phone_numbers[0]["number"])

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="No active SnapServe phone number is available for outbound calls.",
    )


@router.post("/call", response_model=CallResponse, status_code=status.HTTP_200_OK)
async def trigger_call(payload: CallRequest, request: Request) -> CallResponse:
    settings = _get_settings(request)
    phone = payload.phone_number.strip()

    if not phone or len(phone) < 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid phone number is required.",
        )

    if not settings.snapserve_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SNAPSERVE_API_KEY is not configured on the server.",
        )

    agent_id = payload.agent_id or 1
    from_number = _resolve_from_number(settings, agent_id)

    try:
        response = requests.post(
            f"{settings.snapserve_base_url}/calls",
            headers=_build_auth_headers(settings.snapserve_api_key),
            json={
                "agentId": agent_id,
                "toNumber": phone,
                "fromNumber": from_number,
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"SnapServe call request failed: {exc}",
        ) from exc

    if response.status_code >= 400:
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = {"error": response.text or "Unknown SnapServe error"}

        detail = error_payload.get("error") or error_payload
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"SnapServe rejected the call request: {detail}",
        )

    data = response.json()
    return CallResponse(
        status=str(data.get("status", "initiated")),
        message=f"Agent call dispatched to {phone}",
        call_id=str(data.get("id")) if data.get("id") is not None else None,
    )
