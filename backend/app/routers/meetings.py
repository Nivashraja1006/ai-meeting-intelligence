from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.rate_limit import analyze_rate_limiter
from app.schemas.meeting import (
    AnalyzeRequest,
    AnalyzeResponse,
    MeetingDetailResponse,
    MeetingListResponse,
)
from app.services.anthropic_service import analyze_transcript
from app.services.meeting_service import get_meeting, list_meetings, save_meeting
from app.services.pdf_service import generate_meeting_pdf
from app.services.whisper_service import transcribe_audio

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", response_model=MeetingListResponse)
def get_meetings(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MeetingListResponse:
    return list_meetings(db, current_user)


@router.get("/{meeting_id}/export-pdf")
def export_meeting_pdf(
    meeting_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    detail = get_meeting(db, current_user, meeting_id)
    pdf_bytes = generate_meeting_pdf(detail)
    filename = f"meeting-{meeting_id}-report.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting_detail(
    meeting_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MeetingDetailResponse:
    return get_meeting(db, current_user, meeting_id)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_meeting(
    request: AnalyzeRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AnalyzeResponse:
    analyze_rate_limiter.check(str(current_user.id))
    result = await analyze_transcript(request.transcript)
    meeting = save_meeting(db, current_user, request.transcript, "text", result)
    return AnalyzeResponse(id=meeting.id, data=result)


@router.post("/upload-audio", response_model=AnalyzeResponse)
async def upload_audio_meeting(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(..., description="Meeting audio (mp3, wav, m4a, webm, etc.)"),
) -> AnalyzeResponse:
    analyze_rate_limiter.check(str(current_user.id))
    transcript = await transcribe_audio(file)
    result = await analyze_transcript(transcript)
    meeting = save_meeting(db, current_user, transcript, "audio", result)
    return AnalyzeResponse(id=meeting.id, data=result)
