"""Bolna voice-agent API client.

Encapsulates the HTTP calls Jolly needs from Bolna (outbound calls and
execution lookups), keeping route handlers free of integration details.

API reference:
- POST /call                         -> place an outbound call, returns execution_id
- GET  /executions/{execution_id}    -> status, transcript, summary, recording
"""

from typing import Any

import requests
from fastapi import HTTPException, status

from backend.core.config import Settings

# Statuses after which an execution will not change again.
# `call-disconnected` is NOT terminal: Bolna finalizes transcript,
# duration and recording a few seconds later under `completed`.
TERMINAL_STATUSES = frozenset(
    {
        "completed",
        "no-answer",
        "busy",
        "failed",
        "canceled",
        "stopped",
        "error",
        "balance-low",
    }
)


class BolnaError(HTTPException):
    """Raised when a Bolna API call fails or Bolna is misconfigured."""


def _extract_error(response: requests.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or "Unknown Bolna error"
    if isinstance(payload, dict):
        return str(payload.get("message") or payload.get("error") or payload)
    return str(payload)


class BolnaClient:
    """Thin wrapper around the Bolna REST API."""

    def __init__(self, settings: Settings, session: requests.Session | None = None) -> None:
        self._settings = settings
        self._http = session or requests.Session()

    def _headers(self) -> dict[str, str]:
        if not self._settings.bolna_api_key:
            raise BolnaError(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="BOLNA_API_KEY is not configured on the server.",
            )
        return {
            "Authorization": f"Bearer {self._settings.bolna_api_key}",
            "Content-Type": "application/json",
        }

    def resolve_agent_id(self, agent_id: str | None) -> str:
        resolved = (agent_id or self._settings.bolna_agent_id or "").strip()
        if not resolved:
            raise BolnaError(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Bolna agent_id given and BOLNA_AGENT_ID is not configured.",
            )
        return resolved

    def place_call(
        self,
        recipient_phone_number: str,
        agent_id: str | None = None,
        user_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Place an outbound call. Returns Bolna's `{message, status, execution_id}`."""
        headers = self._headers()
        body: dict[str, Any] = {
            "agent_id": self.resolve_agent_id(agent_id),
            "recipient_phone_number": recipient_phone_number,
        }
        if self._settings.bolna_from_number:
            body["from_phone_number"] = self._settings.bolna_from_number
        if user_data:
            body["user_data"] = user_data

        try:
            response = self._http.post(
                f"{self._settings.bolna_base_url}/call",
                headers=headers,
                json=body,
                timeout=30,
            )
        except requests.RequestException as exc:
            raise BolnaError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Bolna call request failed: {exc}",
            ) from exc

        if response.status_code >= 400:
            raise BolnaError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Bolna rejected the call request: {_extract_error(response)}",
            )

        return response.json()

    def get_execution(self, execution_id: str) -> dict[str, Any]:
        """Fetch a call execution (status, transcript, summary, recording)."""
        headers = self._headers()

        try:
            response = self._http.get(
                f"{self._settings.bolna_base_url}/executions/{execution_id}",
                headers=headers,
                timeout=20,
            )
        except requests.RequestException as exc:
            raise BolnaError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Bolna execution request failed: {exc}",
            ) from exc

        if response.status_code == 404:
            raise BolnaError(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bolna could not find execution {execution_id}.",
            )
        if response.status_code >= 400:
            raise BolnaError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Bolna execution lookup failed: {_extract_error(response)}",
            )

        return response.json()
