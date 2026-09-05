"""SnapServe voice-agent API client.

Encapsulates the HTTP calls needed to place outbound calls and check
call status, keeping route handlers free of integration details
(service layer pattern).
"""

import requests
from fastapi import HTTPException, status

from backend.core.config import Settings


class SnapServeError(HTTPException):
    """Raised when a SnapServe API call fails or is misconfigured."""


def _auth_headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _extract_error(response: requests.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or "Unknown SnapServe error"
    return str(payload.get("error") or payload)


class SnapServeClient:
    """Thin wrapper around the SnapServe REST API for outbound calling."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _require_api_key(self) -> str:
        if not self._settings.snapserve_api_key:
            raise SnapServeError(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SNAPSERVE_API_KEY is not configured on the server.",
            )
        return self._settings.snapserve_api_key

    def resolve_from_number(self, agent_id: int) -> str:
        """Return the calling number to use, discovering it if not pinned via env."""
        if self._settings.snapserve_from_number and self._settings.snapserve_from_number.strip():
            return self._settings.snapserve_from_number.strip()

        api_key = self._require_api_key()
        response = requests.get(
            f"{self._settings.snapserve_base_url}/phone-numbers",
            headers=_auth_headers(api_key),
            timeout=20,
        )

        if response.status_code >= 400:
            raise SnapServeError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch SnapServe phone numbers.",
            )

        phone_numbers = response.json()
        for number in phone_numbers:
            if number.get("agentId") == agent_id and number.get("number"):
                return str(number["number"])

        if phone_numbers and phone_numbers[0].get("number"):
            return str(phone_numbers[0]["number"])

        raise SnapServeError(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No active SnapServe phone number is available for outbound calls.",
        )

    def place_outbound_call(self, agent_id: int, to_number: str) -> dict:
        """Place a real outbound call. Must use `/calls/outbound`, not `/calls`

        (the plain `/calls` endpoint only logs a call record and never
        actually dials).
        """
        api_key = self._require_api_key()
        from_number = self.resolve_from_number(agent_id)

        try:
            response = requests.post(
                f"{self._settings.snapserve_base_url}/calls/outbound",
                headers=_auth_headers(api_key),
                json={
                    "agentId": agent_id,
                    "toNumber": to_number,
                    "fromNumber": from_number,
                },
                timeout=30,
            )
        except requests.RequestException as exc:
            raise SnapServeError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"SnapServe call request failed: {exc}",
            ) from exc

        if response.status_code >= 400:
            raise SnapServeError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"SnapServe rejected the call request: {_extract_error(response)}",
            )

        return response.json()

    def get_call_status(self, call_id: str) -> dict:
        api_key = self._require_api_key()

        try:
            response = requests.get(
                f"{self._settings.snapserve_base_url}/calls/{call_id}",
                headers=_auth_headers(api_key),
                timeout=20,
            )
        except requests.RequestException as exc:
            raise SnapServeError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"SnapServe status request failed: {exc}",
            ) from exc

        if response.status_code >= 400:
            raise SnapServeError(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"SnapServe could not find call {call_id}.",
            )

        return response.json()
