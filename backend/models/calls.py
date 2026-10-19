"""Pydantic schemas for the calls API (Bolna-backed)."""

from typing import Any

from pydantic import BaseModel, Field


class CallRequest(BaseModel):
    phone_number: str = Field(
        ...,
        description="Recipient in E.164 format.",
        json_schema_extra={"example": "+919876543210"},
    )
    agent_id: str | None = Field(
        default=None,
        description="Bolna agent UUID. Falls back to BOLNA_AGENT_ID.",
    )
    user_data: dict[str, Any] | None = Field(
        default=None,
        description="Variables injected into the Bolna agent prompt, e.g. case_id.",
        json_schema_extra={"example": {"case_id": "1042"}},
    )


class CallResponse(BaseModel):
    status: str
    message: str
    call_id: str | None = None


class CallStatusResponse(BaseModel):
    call_id: str
    status: str
    is_terminal: bool = False
    duration_seconds: float | None = None
    transcript: str | None = None
    summary: str | None = None
    recording_url: str | None = None
    error_message: str | None = None
