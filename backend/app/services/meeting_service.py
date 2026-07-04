from sqlalchemy.orm import Session, selectinload

from fastapi import HTTPException, status

from app.models.action_item import ActionItem as ActionItemModel
from app.models.meeting import Meeting
from app.models.user import User
from app.schemas.meeting import (
    ActionItem,
    FollowUpEmail,
    MeetingDetailResponse,
    MeetingIntelligence,
    MeetingListItem,
    MeetingListResponse,
    ParticipantSentiment,
)


def _to_meeting_intelligence(meeting: Meeting) -> MeetingIntelligence:
    return MeetingIntelligence(
        meeting_title=meeting.meeting_title,
        summary=meeting.summary,
        action_items=[
            ActionItem(task=item.task, owner=item.owner, due_date=item.due_date)
            for item in meeting.action_items
        ],
        key_decisions=meeting.key_decisions,
        open_questions=meeting.open_questions,
        participant_sentiment=[
            ParticipantSentiment(**entry) for entry in meeting.participant_sentiment
        ],
        follow_up_email=FollowUpEmail(
            subject=meeting.follow_up_email_subject,
            body=meeting.follow_up_email_body,
        ),
    )


def save_meeting(
    db: Session,
    user: User,
    transcript: str,
    source: str,
    intelligence: MeetingIntelligence,
) -> Meeting:
    meeting = Meeting(
        user_id=user.id,
        transcript=transcript,
        source=source,
        meeting_title=intelligence.meeting_title,
        summary=intelligence.summary,
        key_decisions=intelligence.key_decisions,
        open_questions=intelligence.open_questions,
        participant_sentiment=[
            entry.model_dump() for entry in intelligence.participant_sentiment
        ],
        follow_up_email_subject=intelligence.follow_up_email.subject,
        follow_up_email_body=intelligence.follow_up_email.body,
    )
    db.add(meeting)
    db.flush()

    for item in intelligence.action_items:
        db.add(
            ActionItemModel(
                meeting_id=meeting.id,
                task=item.task,
                owner=item.owner,
                due_date=item.due_date,
            )
        )

    db.commit()
    db.refresh(meeting)
    return meeting


def list_meetings(db: Session, user: User) -> MeetingListResponse:
    meetings = (
        db.query(Meeting)
        .options(selectinload(Meeting.action_items))
        .filter(Meeting.user_id == user.id)
        .order_by(Meeting.created_at.desc())
        .all()
    )
    return MeetingListResponse(
        meetings=[
            MeetingListItem(
                id=meeting.id,
                meeting_title=meeting.meeting_title,
                created_at=meeting.created_at,
                action_item_count=len(meeting.action_items),
            )
            for meeting in meetings
        ]
    )


def get_meeting(db: Session, user: User, meeting_id: int) -> MeetingDetailResponse:
    meeting = (
        db.query(Meeting)
        .options(selectinload(Meeting.action_items))
        .filter(Meeting.id == meeting_id, Meeting.user_id == user.id)
        .first()
    )
    if meeting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )

    return MeetingDetailResponse(
        id=meeting.id,
        transcript=meeting.transcript,
        source=meeting.source,  # type: ignore[arg-type]
        created_at=meeting.created_at,
        data=_to_meeting_intelligence(meeting),
    )
