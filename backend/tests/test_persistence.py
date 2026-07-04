"""Persistence tests — no live LLM/API keys required."""
import pytest
from fastapi import HTTPException

from app.models.user import User
from app.schemas.meeting import (
    ActionItem,
    FollowUpEmail,
    MeetingIntelligence,
    ParticipantSentiment,
)
from app.services.meeting_service import get_meeting, list_meetings, save_meeting

SAMPLE_INTELLIGENCE = MeetingIntelligence(
    meeting_title="Q3 Launch Planning",
    summary="Team aligned on MVP scope and March 15 API deadline.",
    action_items=[
        ActionItem(task="Write integration tests", owner="Mike", due_date="2026-03-15"),
        ActionItem(task="Send updated mockups", owner="Lisa", due_date=None),
    ],
    key_decisions=["Ship MVP without analytics dashboard"],
    open_questions=["Do we need legal review before beta?"],
    participant_sentiment=[
        ParticipantSentiment(
            participant="Sarah",
            sentiment="positive",
            notes="Kept the meeting focused and drove decisions.",
        )
    ],
    follow_up_email=FollowUpEmail(
        subject="Q3 Launch Plan — Action Items",
        body="Hi team,\n\nSummary attached.\n\nThanks,\nSarah",
    ),
)

SAMPLE_TRANSCRIPT = (
    "Sarah (PM): Thanks everyone. We need to finalize the Q3 launch plan today. "
    "Mike (Eng): I can have the API endpoints ready by March 15 if we lock the schema today. "
    "Sarah: Agreed — we decided to ship the MVP without the analytics dashboard. "
    "Lisa (Design): I'll send updated mockups to Mike by end of week. "
    "Sarah: Mike, please write integration tests before the March 15 deadline. "
    "Mike: Will do. Open question: do we need legal review before beta?"
)


def _create_user(db_session, email: str) -> User:
    user = User(email=email, hashed_password="hashed")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_save_and_list_meetings(db_session):
    user = _create_user(db_session, "persist@example.com")
    save_meeting(db_session, user, SAMPLE_TRANSCRIPT, "text", SAMPLE_INTELLIGENCE)

    result = list_meetings(db_session, user)
    assert len(result.meetings) == 1
    assert result.meetings[0].meeting_title == "Q3 Launch Planning"
    assert result.meetings[0].action_item_count == 2


def test_get_meeting_detail(db_session):
    user = _create_user(db_session, "detail@example.com")
    meeting = save_meeting(db_session, user, SAMPLE_TRANSCRIPT, "text", SAMPLE_INTELLIGENCE)

    detail = get_meeting(db_session, user, meeting.id)
    assert detail.id == meeting.id
    assert detail.source == "text"
    assert detail.transcript == SAMPLE_TRANSCRIPT
    assert detail.data.meeting_title == "Q3 Launch Planning"
    assert len(detail.data.action_items) == 2


def test_get_meeting_not_found_returns_404(db_session):
    user = _create_user(db_session, "missing@example.com")

    with pytest.raises(HTTPException) as exc_info:
        get_meeting(db_session, user, 9999)
    assert exc_info.value.status_code == 404


def test_user_cannot_access_other_users_meeting(db_session):
    owner = _create_user(db_session, "owner@example.com")
    other = _create_user(db_session, "other@example.com")
    meeting = save_meeting(db_session, owner, SAMPLE_TRANSCRIPT, "text", SAMPLE_INTELLIGENCE)

    with pytest.raises(HTTPException) as exc_info:
        get_meeting(db_session, other, meeting.id)
    assert exc_info.value.status_code == 404


def test_list_meetings_empty_for_new_user(client, auth_headers):
    response = client.get("/meetings", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["meetings"] == []


def test_get_meeting_detail_via_api_returns_404(client, auth_headers):
    response = client.get("/meetings/9999", headers=auth_headers)
    assert response.status_code == 404
