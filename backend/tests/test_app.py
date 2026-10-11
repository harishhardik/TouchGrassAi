import json

import httpx
from fastapi.testclient import TestClient

import app as app_module


client = TestClient(app_module.app)


def test_health_reports_configured_model():
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model"] == app_module.OLLAMA_MODEL


def test_invalid_mission_request_is_rejected():
    response = client.post(
        "/api/missions",
        json={
            "minutes": 2,
            "interest": "gardening",
            "energy": "medium",
        },
    )

    assert response.status_code == 422


def test_invalid_interest_is_rejected():
    response = client.post(
        "/api/missions",
        json={
            "minutes": 20,
            "interest": "shopping",
            "energy": "medium",
        },
    )

    assert response.status_code == 422


def test_ollama_success_returns_local_ai(monkeypatch):
    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "response": json.dumps({
                    "title": "Garden Observation",
                    "description": "Observe a plant outdoors.",
                    "steps": [
                        "Choose a safe plant to observe.",
                        "Notice its leaves and surroundings.",
                    ],
                    "duration_minutes": 20,
                    "interest": "gardening",
                    "safety_note": "Avoid unknown plants.",
                })
            }

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return FakeResponse()

    monkeypatch.setattr(app_module.httpx, "AsyncClient", FakeAsyncClient)

    response = client.post(
        "/api/missions",
        json={
            "minutes": 20,
            "interest": "gardening",
            "energy": "medium",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "local-ai"
    assert body["interest"] == "gardening"
    assert body["duration_minutes"] == 20
    assert 2 <= len(body["steps"]) <= 4


def test_invalid_ollama_json_uses_fallback(monkeypatch):
    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"response": "This is not JSON"}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            return FakeResponse()

    monkeypatch.setattr(app_module.httpx, "AsyncClient", FakeAsyncClient)

    response = client.post(
        "/api/missions",
        json={
            "minutes": 10,
            "interest": "walking",
            "energy": "low",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "offline-template"
    assert body["interest"] == "walking"
    assert body["duration_minutes"] == 10


def test_ollama_http_error_uses_fallback(monkeypatch):
    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            request = httpx.Request(
                "POST", app_module.OLLAMA_URL
            )
            raise httpx.ConnectError(
                "Ollama unavailable", request=request
            )

    monkeypatch.setattr(app_module.httpx, "AsyncClient", FakeAsyncClient)

    response = client.post(
        "/api/missions",
        json={
            "minutes": 30,
            "interest": "birdwatching",
            "energy": "medium",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "offline-template"
    assert body["interest"] == "birdwatching"
