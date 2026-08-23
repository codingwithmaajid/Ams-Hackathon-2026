import logging
import os

import requests
from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

SNAPSERVE_OUTBOUND_CALL_URL = "https://app.snapserve.ai/api/calls/outbound"

router = APIRouter()
logger = logging.getLogger(__name__)


class CallRequest(BaseModel):
    agent_id: int = Field(gt=0)
    phone_number: str = Field(min_length=8, max_length=32)


def get_snapserve_api_key() -> str:
    api_key = os.getenv("SNAPSERVE_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="SNAPSERVE_API_KEY is not configured.",
        )

    return api_key


def create_snapserve_call(request: CallRequest) -> dict:
    response = requests.post(
        SNAPSERVE_OUTBOUND_CALL_URL,
        headers={
            "Authorization": f"Bearer {get_snapserve_api_key()}",
            "Content-Type": "application/json",
        },
        json={
            "agentId": request.agent_id,
            "toNumber": request.phone_number,
        },
        timeout=30,
    )

    if not response.ok:
        logger.warning(
            "SnapServe outbound call failed with status %s",
            response.status_code,
        )
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text or "SnapServe call failed.",
        )

    try:
        return response.json()
    except ValueError as exc:
        logger.exception("SnapServe returned a non-JSON response")
        raise HTTPException(
            status_code=502,
            detail="SnapServe returned an invalid response.",
        ) from exc


@router.post("/call")
async def make_call(request: CallRequest) -> dict:
    logger.info("Starting SnapServe outbound call")

    try:
        return await run_in_threadpool(create_snapserve_call, request)
    except requests.RequestException as exc:
        logger.exception("SnapServe request failed")
        raise HTTPException(
            status_code=502,
            detail="Could not reach SnapServe.",
        ) from exc
