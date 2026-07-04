"""Validation and auth tests — no live LLM/API keys required."""
import io

SAMPLE_TRANSCRIPT = (
    "Sarah (PM): Thanks everyone. We need to finalize the Q3 launch plan today. "
    "Mike (Eng): I can have the API endpoints ready by March 15 if we lock the schema today. "
    "Sarah: Agreed — we decided to ship the MVP without the analytics dashboard. "
    "Lisa (Design): I'll send updated mockups to Mike by end of week. "
    "Sarah: Mike, please write integration tests before the March 15 deadline. "
    "Mike: Will do. Open question: do we need legal review before beta?"
)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_signup_returns_tokens(client):
    response = client.post(
        "/auth/signup",
        json={"email": "newuser@example.com", "password": "securepass123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"]


def test_signup_duplicate_email_returns_409(client):
    payload = {"email": "dup@example.com", "password": "securepass123"}
    assert client.post("/auth/signup", json=payload).status_code == 201
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_login_success(client):
    client.post(
        "/auth/signup",
        json={"email": "login@example.com", "password": "securepass123"},
    )
    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "securepass123"},
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_wrong_password_returns_401(client):
    client.post(
        "/auth/signup",
        json={"email": "wrongpass@example.com", "password": "securepass123"},
    )
    response = client.post(
        "/auth/login",
        json={"email": "wrongpass@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_refresh_token_issues_new_pair(client):
    signup = client.post(
        "/auth/signup",
        json={"email": "refresh@example.com", "password": "securepass123"},
    )
    refresh_token = signup.json()["refresh_token"]
    response = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]


def test_meetings_requires_auth(client):
    response = client.post(
        "/meetings/analyze",
        json={"transcript": SAMPLE_TRANSCRIPT},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_analyze_rejects_short_transcript(client, auth_headers):
    response = client.post(
        "/meetings/analyze",
        json={"transcript": "Short meeting. Done."},
        headers=auth_headers,
    )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(
        err["loc"] == ["body", "transcript"] and err["type"] == "string_too_short"
        for err in detail
    )


def test_analyze_rejects_empty_transcript(client, auth_headers):
    response = client.post(
        "/meetings/analyze",
        json={"transcript": ""},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_analyze_requires_api_key_for_valid_transcript(client, auth_headers):
    response = client.post(
        "/meetings/analyze",
        json={"transcript": SAMPLE_TRANSCRIPT},
        headers=auth_headers,
    )
    assert response.status_code == 503
    assert "Anthropic API key is not configured" in response.json()["detail"]


def test_upload_audio_rejects_unsupported_format(client, auth_headers):
    response = client.post(
        "/meetings/upload-audio",
        files={"file": ("notes.txt", io.BytesIO(b"not audio"), "text/plain")},
        headers=auth_headers,
    )
    assert response.status_code == 415


def test_upload_audio_rejects_empty_file(client, auth_headers):
    response = client.post(
        "/meetings/upload-audio",
        files={"file": ("meeting.mp3", io.BytesIO(b""), "audio/mpeg")},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_upload_audio_requires_openai_api_key(client, auth_headers):
    response = client.post(
        "/meetings/upload-audio",
        files={"file": ("meeting.mp3", io.BytesIO(b"fake-audio-bytes"), "audio/mpeg")},
        headers=auth_headers,
    )
    assert response.status_code == 503
    assert "OpenAI API key is not configured" in response.json()["detail"]
