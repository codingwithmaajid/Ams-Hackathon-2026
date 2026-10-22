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


def test_llm_health_reports_state() -> None:
    with TestClient(app) as c:
        r = c.get("/health/llm")
        assert r.status_code == 200
        body = r.json()
        assert "embedder" in body and "llm_configured" in body


def test_gemini_falls_back_to_next_model(monkeypatch) -> None:
    from backend.services import llm as llm_mod

    calls = []

    class Resp:
        def __init__(self, code, payload):
            self.status_code, self._p = code, payload
            self.ok = code < 400
            self.text = ""

        def json(self):
            return self._p

        def raise_for_status(self):
            raise AssertionError("should not be called")

    def fake_post(url, **kw):
        model = url.split("/models/")[1].split(":")[0]
        calls.append(model)
        if model == "missing-model":
            return Resp(404, {"error": {"message": "not found"}})
        return Resp(200, {"candidates": [{"content": {"parts": [{"text": '{"ok": true}'}]}}]})

    monkeypatch.setattr(llm_mod.requests, "post", fake_post)
    g = llm_mod.GeminiLLM("k", model="missing-model", fallbacks=("lite",))
    assert g.generate_json("s", "u") == {"ok": True}
    assert calls == ["missing-model", "lite"]
    assert g.active_model == "lite" and g.last_error is None
    g.generate_json("s", "u")
    assert calls[-1] == "lite"  # sticky on the model that worked
