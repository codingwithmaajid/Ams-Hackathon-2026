"""Pydantic schemas for the calls API."""

from pydantic import BaseModel, Field


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


class CallStatusResponse(BaseModel):
    call_id: str
    status: str
    duration_seconds: int | None = None
    transcript: str | None = None
    error_message: str | None = None
