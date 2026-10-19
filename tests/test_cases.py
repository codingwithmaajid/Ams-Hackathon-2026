from dataclasses import replace
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from backend.core.config import Settings
from backend.main import create_app
from backend.services.cases import spoken_digits_to_number

SETTINGS = Settings(database_url="sqlite://")


@pytest.fixture()
def client() -> TestClient:
    return TestClient(create_app(SETTINGS))


@pytest.mark.parametrize(
    "spoken, expected",
    [
        ("ten forty two", "1042"),
        ("case 1042", "1042"),
        ("twenty two seventeen", "2217"),
        ("zero seven eight nine", "0789"),
        ("C.S. No. 2217 of 2024", "22172024"),
    ],
)
def test_spoken_digits(spoken: str, expected: str) -> None:
    assert spoken_digits_to_number(spoken) == expected


def test_seeded_cases_are_listed(client: TestClient) -> None:
    ids = {c["id"] for c in client.get("/cases").json()}
    assert ids == {"1042", "2217", "0789"}


def test_daily_brief_lists_todays_matters_in_order(client: TestClient) -> None:
    body = client.get("/briefs/daily").json()
    assert [m["case_id"] for m in body["matters"]] == ["2217", "1042"]
    assert body["spoken_summary"].startswith("Good morning. You have 2 matters today.")


def test_daily_brief_for_another_day(client: TestClient) -> None:
    day = (date.today() + timedelta(days=3)).isoformat()
    body = client.get(f"/briefs/daily?date={day}").json()
    assert [m["case_id"] for m in body["matters"]] == ["0789"]


def test_case_brief_is_cited(client: TestClient) -> None:
    brief = client.get("/cases/1042/brief").json()
    assert "Last chance granted" in brief["lines"][0]["text"]
    assert brief["lines"][0]["citation"] == {
        "doc_id": "1042-OS-2",
        "doc_title": "Order sheet",
        "para": "P2",
        "doc_date": (date.today() - timedelta(days=21)).isoformat(),
    }


def test_timeline_and_tasks(client: TestClient) -> None:
    timeline = client.get("/cases/2217/timeline").json()
    assert [e["kind"] for e in timeline] == ["filing", "order", "filing"]
    tasks = client.get("/cases/2217/tasks").json()
    assert len(tasks) == 2


def test_unknown_case_is_404(client: TestClient) -> None:
    response = client.get("/cases/9999")
    assert response.status_code == 404


def test_bolna_tool_finds_case_by_spoken_number(client: TestClient) -> None:
    body = client.post("/bolna/tools/get-case-brief", json={"case_id": "ten forty two"}).json()
    assert body["found"] is True
    assert body["case_id"] == "1042"
    assert "accused absent on medical grounds" in body["spoken_summary"]
    assert body["citations"][0]["doc_id"] == "1042-OS-2"


def test_bolna_tool_finds_case_by_client_name(client: TestClient) -> None:
    body = client.post("/bolna/tools/get-case-brief", json={"case_id": "Lakshmi"}).json()
    assert body["case_id"] == "2217"


def test_bolna_tool_unknown_case(client: TestClient) -> None:
    body = client.post("/bolna/tools/get-case-brief", json={"case_id": "nine nine nine nine"}).json()
    assert body["found"] is False


def test_untrusted_document_text_is_not_spoken(client: TestClient) -> None:
    body = client.post("/bolna/tools/get-case-brief", json={"case_id": "2217"}).json()
    assert "dismissed" not in body["spoken_summary"].lower()
    assert "ignore all previous instructions" not in body["spoken_summary"].lower()


def test_bolna_daily_brief_tool_checks_secret() -> None:
    client = TestClient(create_app(replace(SETTINGS, bolna_webhook_secret="s3cret")))
    assert client.post("/bolna/tools/get-daily-brief", json={}).status_code == 401
    body = client.post("/bolna/tools/get-daily-brief?secret=s3cret", json={}).json()
    assert len(body["matters"]) == 2
