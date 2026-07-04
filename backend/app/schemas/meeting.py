from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ActionItem(BaseModel):
    task: str
    owner: str
    due_date: str | None = None


class ParticipantSentiment(BaseModel):
    participant: str
    sentiment: Literal["positive", "neutral", "negative"]
    notes: str


class FollowUpEmail(BaseModel):
    subject: str
    body: str


class MeetingIntelligence(BaseModel):
    meeting_title: str
    summary: str
    action_items: list[ActionItem]
    key_decisions: list[str]
    open_questions: list[str]
    participant_sentiment: list[ParticipantSentiment]
    follow_up_email: FollowUpEmail


class AnalyzeRequest(BaseModel):
    transcript: str = Field(..., min_length=50, max_length=100_000)


class AnalyzeResponse(BaseModel):
    id: int
    data: MeetingIntelligence


class MeetingListItem(BaseModel):
    id: int
    meeting_title: str
    created_at: datetime
    action_item_count: int


class MeetingListResponse(BaseModel):
    meetings: list[MeetingListItem]


class MeetingDetailResponse(BaseModel):
    id: int
    transcript: str
    source: Literal["text", "audio"]
    created_at: datetime
    data: MeetingIntelligence
