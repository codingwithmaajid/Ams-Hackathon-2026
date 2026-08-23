from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_root_returns_service_metadata() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "name": "AIRA",
        "service": "judicial-workflow-agent",
        "version": "0.1.0",
    }


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "aira-backend",
    }


def test_malformed_call_request_returns_consistent_error() -> None:
    response = client.post(
        "/call",
        json={
            "agent_id": 0,
            "phone_number": "",
        },
    )

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["message"] == "Request validation failed."
