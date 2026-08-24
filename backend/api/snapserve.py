# backend/api/snapserve.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/calls", tags=["Calls"])

class CallRequest(BaseModel):
    phone_number: str = Field(..., example="+1234567890")
    agent_id: str | None = "default-agent"

class CallResponse(BaseModel):
    status: str
    message: str
    call_id: str | None = None

@router.post("/trigger", response_model=CallResponse, status_code=status.HTTP_200_OK)
async def trigger_call(payload: CallRequest):
    phone = payload.phone_number.strip()

    # Basic validation
    if not phone or len(phone) < 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid phone number is required."
        )

    # TODO: Connect to your telephony/agent provider (e.g., Twilio, Vapi, Retell, Bland)
    # Example: call_id = await call_agent_service.initiate_call(phone)

    return CallResponse(
        status="initiated",
        message=f"Agent call dispatched to {phone}",
        call_id="call_mock_12345"
    )
