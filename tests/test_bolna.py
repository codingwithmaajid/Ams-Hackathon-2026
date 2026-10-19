from dataclasses import replace
from typing import Any

import pytest
from fastapi.testclient import TestClient

from backend.api import bolna as bolna_api
from backend.core.config import Settings
from backend.main import create_app
from backend.services import bolna_client


class FakeResponse:
    def __init__(self, status_code: int, payload: Any) -> None:
        self.status_code = status_code
        self._payload = payload
        self.text = str(payload)

    def json(self) -> Any:
        return self._payload


class FakeSession:
    def __init__(self, response: FakeResponse) -> None:
        self.response = response
        self.calls: list[tuple[str, str, dict]] = []

    def post(self, url: str, **kwargs: Any) -> FakeResponse:
        self.calls.append(("POST", url, kwargs))
        return self.response

    def get(self, url: str, **kwargs: Any) -> FakeResponse:
        self.calls.append(("GET", url, kwargs))
        return self.response


BASE = Settings(bolna_api_key="test-key", bolna_agent_id="agent-uuid", database_url="sqlite://")


def make_client(settings: Settings, session: FakeSession, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    original = bolna_client.BolnaClient.__init__

    def patched(self: bolna_client.BolnaClient, s: Settings, session_arg: Any = None) -> None:
        original(self, s, session)

    monkeypatch.setattr(bolna_client.BolnaClient, "__init__", patched)
    return TestClient(create_app(settings))


def test_place_call_sends_bolna_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    session = FakeSession(FakeResponse(200, {"message": "done", "status": "queued", "execution_id": "exec-1"}))
    client = make_client(BASE, session, monkeypatch)

    response = client.post("/call", json={"phone_number": "+91 98765 43210", "user_data": {"case_id": "1042"}})

    assert response.status_code == 200
    assert response.json()["call_id"] == "exec-1"
    method, url, kwargs = session.calls[0]
    assert (method, url) == ("POST", "https://api.bolna.ai/call")
    assert kwargs["headers"]["Authorization"] == "Bearer test-key"
    assert kwargs["json"] == {
        "agent_id": "agent-uuid",
        "recipient_phone_number": "+919876543210",
        "user_data": {"case_id": "1042"},
    }


def test_missing_api_key_is_reported(monkeypatch: pytest.MonkeyPatch) -> None:
    session = FakeSession(FakeResponse(200, {}))
    client = make_client(replace(BASE, bolna_api_key=None), session, monkeypatch)

    response = client.post("/call", json={"phone_number": "+919876543210"})

    assert response.status_code == 500
    assert "BOLNA_API_KEY" in response.json()["error"]["message"]
    assert session.calls == []


def test_call_status_maps_execution(monkeypatch: pytest.MonkeyPatch) -> None:
    session = FakeSession(
        FakeResponse(
            200,
            {
                "id": "exec-1",
                "status": "completed",
                "conversation_duration": 42.5,
                "transcript": "assistant: Hello",
                "summary": "Judge asked for case 1042.",
                "telephony_data": {"recording_url": "https://example.com/rec.mp3"},
            },
        )
    )
    client = make_client(BASE, session, monkeypatch)

    body = client.get("/call/exec-1").json()

    assert session.calls[0][1] == "https://api.bolna.ai/executions/exec-1"
    assert body["status"] == "completed"
    assert body["is_terminal"] is True
    assert body["duration_seconds"] == 42.5
    assert body["recording_url"] == "https://example.com/rec.mp3"


def test_call_disconnected_is_not_terminal(monkeypatch: pytest.MonkeyPatch) -> None:
    session = FakeSession(FakeResponse(200, {"id": "exec-1", "status": "call-disconnected"}))
    client = make_client(BASE, session, monkeypatch)

    assert client.get("/call/exec-1").json()["is_terminal"] is False


def test_webhook_stores_event_and_checks_secret() -> None:
    bolna_api.RECENT_EVENTS.clear()
    client = TestClient(create_app(replace(BASE, bolna_webhook_secret="s3cret")))

    denied = client.post("/bolna/webhook", json={"id": "exec-1", "status": "completed"})
    assert denied.status_code == 401

    ok = client.post("/bolna/webhook?secret=s3cret", json={"id": "exec-1", "status": "completed"})
    assert ok.status_code == 200
    assert client.get("/bolna/executions/recent").json()[0]["id"] == "exec-1"


def test_case_brief_tool_trims_and_finds_case() -> None:
    client = TestClient(create_app(BASE))

    body = client.post("/bolna/tools/get-case-brief", json={"case_id": " 1042 "}).json()

    assert body["case_id"] == "1042"
    assert body["found"] is True

