"""Validation-only smoke test — uses FastAPI TestClient."""
import json
import sys

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import user as user_model  # noqa: F401

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

SAMPLE_TRANSCRIPT = (
    "Sarah (PM): Thanks everyone. We need to finalize the Q3 launch plan today. "
    "Mike (Eng): I can have the API endpoints ready by March 15 if we lock the schema today. "
    "Sarah: Agreed — we decided to ship the MVP without the analytics dashboard. "
    "Lisa (Design): I'll send updated mockups to Mike by end of week. "
    "Sarah: Mike, please write integration tests before the March 15 deadline. "
    "Mike: Will do. Open question: do we need legal review before beta?"
)


def auth_headers() -> dict[str, str]:
    response = client.post(
        "/auth/signup",
        json={"email": "smoke@example.com", "password": "securepass123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def run_case(label: str, method: str, path: str, headers: dict | None = None, **kwargs) -> None:
    print(f"\n{'=' * 72}\n{label}\n{'=' * 72}")
    if method == "GET":
        response = client.get(path, headers=headers)
    else:
        response = client.post(path, headers=headers, **kwargs)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))


def main() -> int:
    headers = auth_headers()
    run_case("GET /health", "GET", "/health")
    run_case(
        "POST /meetings/analyze — no auth → 401",
        "POST",
        "/meetings/analyze",
        json={"transcript": SAMPLE_TRANSCRIPT},
    )
    run_case(
        "POST /meetings/analyze — with auth, no API key → 503",
        "POST",
        "/meetings/analyze",
        headers=headers,
        json={"transcript": SAMPLE_TRANSCRIPT},
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
