import asyncio
import io
from pathlib import Path

from fastapi import HTTPException, UploadFile
from openai import APIError, OpenAI

from app.config import settings

ALLOWED_EXTENSIONS = {".flac", ".m4a", ".mp3", ".mp4", ".mpeg", ".mpga", ".oga", ".ogg", ".wav", ".webm"}
ALLOWED_CONTENT_TYPES = {
    "audio/flac",
    "audio/m4a",
    "audio/mp4",
    "audio/mpeg",
    "audio/mp3",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "audio/x-m4a",
    "audio/x-wav",
    "video/mp4",
    "video/webm",
}


def _get_client() -> OpenAI:
    if not settings.openai_api_key.strip():
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key is not configured. Set OPENAI_API_KEY in .env",
        )
    return OpenAI(api_key=settings.openai_api_key)


def _validate_upload(file: UploadFile, content: bytes) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename")

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        supported = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported audio format '{extension or 'unknown'}'. Supported: {supported}",
        )

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported content type '{content_type}'. Upload a standard audio file.",
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(content) > settings.max_audio_upload_bytes:
        max_mb = settings.max_audio_upload_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"Audio file exceeds maximum size of {max_mb} MB",
        )

    return extension


def _transcribe_sync(file: UploadFile, content: bytes, extension: str) -> str:
    client = _get_client()
    audio_buffer = io.BytesIO(content)
    audio_buffer.name = file.filename or f"upload{extension}"

    try:
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_buffer,
        )
    except APIError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Whisper transcription failed: {exc}",
        ) from exc

    transcript = transcription.text.strip()
    if len(transcript) < 50:
        raise HTTPException(
            status_code=422,
            detail=(
                "Transcription produced fewer than 50 characters. "
                "Upload a longer recording or paste the transcript instead."
            ),
        )
    return transcript


async def transcribe_audio(file: UploadFile) -> str:
    content = await file.read()
    extension = _validate_upload(file, content)
    return await asyncio.to_thread(_transcribe_sync, file, content, extension)
