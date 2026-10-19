from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_root_returns_service_metadata() -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "name": "Jolly",
        "service": "legal-agent",
        "version": "0.2.0",
    }


def test_health_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "jolly-backend",
    }


def test_malformed_call_request_returns_consistent_error() -> None:
    response = client.post(
        "/call",
        json={"phone_number": ""},
    )

    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "HTTP_ERROR"
    assert "E.164" in body["error"]["message"]
