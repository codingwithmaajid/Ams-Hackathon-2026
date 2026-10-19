"""Schemas for inbound traffic from Bolna (webhooks and tool calls)."""

import datetime as dt
from typing import Any

from pydantic import BaseModel, ConfigDict


class BolnaExecutionEvent(BaseModel):
    """Execution payload Bolna POSTs to the agent's webhook_url.

    Only the fields Jolly reads are typed; everything else is kept.
    """

    model_config = ConfigDict(extra="allow")

    id: str | None = None
    agent_id: str | None = None
    status: str | None = None
    transcript: str | None = None
    summary: str | None = None
    extracted_data: dict[str, Any] | None = None
    context_details: dict[str, Any] | None = None


class CaseLookupRequest(BaseModel):
    """Arguments the Bolna agent passes to the `get_case_brief` custom function."""

    case_id: str


class CaseLookupResponse(BaseModel):
    case_id: str
    found: bool
    spoken_summary: str
    citations: list[dict[str, Any]] = []


class DailyBriefRequest(BaseModel):
    """Arguments for the `get_daily_brief` custom function (all optional)."""

    date: dt.date | None = None
    advocate: str | None = None
