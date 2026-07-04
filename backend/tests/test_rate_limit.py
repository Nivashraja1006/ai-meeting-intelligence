"""Tests for analyze/upload rate limiting."""
import pytest
from fastapi import HTTPException

from app.rate_limit import RateLimiter

SAMPLE_TRANSCRIPT = (
    "Sarah (PM): Thanks everyone. We need to finalize the Q3 launch plan today. "
    "Mike (Eng): I can have the API endpoints ready by March 15 if we lock the schema today. "
    "Sarah: Agreed — we decided to ship the MVP without the analytics dashboard. "
    "Lisa (Design): I'll send updated mockups to Mike by end of week. "
    "Sarah: Mike, please write integration tests before the March 15 deadline. "
    "Mike: Will do. Open question: do we need legal review before beta?"
)


def test_rate_limiter_blocks_after_max_requests():
    limiter = RateLimiter(max_requests=2, window_seconds=60)
    limiter.check("user-1")
    limiter.check("user-1")

    with pytest.raises(HTTPException) as exc_info:
        limiter.check("user-1")
    assert exc_info.value.status_code == 429


def test_rate_limiter_isolated_per_user():
    limiter = RateLimiter(max_requests=1, window_seconds=60)
    limiter.check("user-a")

    with pytest.raises(HTTPException):
        limiter.check("user-a")
    limiter.check("user-b")


def test_analyze_endpoint_returns_429_when_rate_limited(client, auth_headers, monkeypatch):
    from app.rate_limit import analyze_rate_limiter

    monkeypatch.setattr(analyze_rate_limiter, "max_requests", 1)
    monkeypatch.setattr(analyze_rate_limiter, "window_seconds", 60)
    analyze_rate_limiter.reset()

    first = client.post(
        "/meetings/analyze",
        json={"transcript": SAMPLE_TRANSCRIPT},
        headers=auth_headers,
    )
    assert first.status_code == 503  # no API key, but rate limit counted

    second = client.post(
        "/meetings/analyze",
        json={"transcript": SAMPLE_TRANSCRIPT},
        headers=auth_headers,
    )
    assert second.status_code == 429

    analyze_rate_limiter.reset()
