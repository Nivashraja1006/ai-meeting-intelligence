import os
import asyncio
import json
import anthropic
from anthropic import APIError
from fastapi import HTTPException
from pydantic import ValidationError

from app.config import settings
from app.schemas.meeting import MeetingIntelligence

SYSTEM_PROMPT = """You are an expert meeting intelligence analyst.
Analyze the provided meeting transcript thoroughly and extract structured intelligence.
Always respond exclusively via the extract_meeting_intelligence tool.
Infer participants from speaker labels or context.
Use 'Unassigned' for action item owners when unclear.
Use null for due_date when no date is mentioned or inferable.
Return empty arrays when no items exist for list fields — never omit required fields."""

EXTRACT_MEETING_INTELLIGENCE_TOOL = {
    "name": "extract_meeting_intelligence",
    "description": (
        "Extract structured meeting intelligence from a raw transcript. "
        "Return all fields; use null for unknown due dates."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "meeting_title": {
                "type": "string",
                "description": "Concise title inferred from the meeting content",
            },
            "summary": {
                "type": "string",
                "description": "2-4 paragraph executive summary of the meeting",
            },
            "action_items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "task": {"type": "string"},
                        "owner": {
                            "type": "string",
                            "description": (
                                "Person responsible; use 'Unassigned' if unclear"
                            ),
                        },
                        "due_date": {
                            "type": ["string", "null"],
                            "description": "ISO date YYYY-MM-DD or null",
                        },
                    },
                    "required": ["task", "owner", "due_date"],
                },
            },
            "key_decisions": {
                "type": "array",
                "items": {"type": "string"},
            },
            "open_questions": {
                "type": "array",
                "items": {"type": "string"},
            },
            "participant_sentiment": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "participant": {"type": "string"},
                        "sentiment": {
                            "type": "string",
                            "enum": ["positive", "neutral", "negative"],
                        },
                        "notes": {
                            "type": "string",
                            "description": "Brief rationale for the sentiment label",
                        },
                    },
                    "required": ["participant", "sentiment", "notes"],
                },
            },
            "follow_up_email": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string"},
                    "body": {
                        "type": "string",
                        "description": "Full email body, ready to send",
                    },
                },
                "required": ["subject", "body"],
            },
        },
        "required": [
            "meeting_title",
            "summary",
            "action_items",
            "key_decisions",
            "open_questions",
            "participant_sentiment",
            "follow_up_email",
        ],
    },
}


def _get_client() -> anthropic.Anthropic:
    if not settings.anthropic_api_key.strip():
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key is not configured. Set ANTHROPIC_API_KEY in .env",
        )
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _extract_tool_input(response: anthropic.types.Message) -> dict:
    for block in response.content:
        if block.type == "tool_use" and block.name == "extract_meeting_intelligence":
            return block.input
    raise HTTPException(
        status_code=502,
        detail="LLM did not return the expected tool_use block",
    )


def _validate_tool_input(tool_input: dict) -> MeetingIntelligence:
    return MeetingIntelligence.model_validate(tool_input)


def _call_anthropic(
    client: anthropic.Anthropic,
    messages: list[dict],
) -> anthropic.types.Message:
    try:
        return client.messages.create(
            model=settings.anthropic_model,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=[{"type": "function", **EXTRACT_MEETING_INTELLIGENCE_TOOL}],
            tool_choice={"type": "tool", "name": "extract_meeting_intelligence"},
            messages=messages,
        )
    except APIError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Anthropic API error: {exc}",
        ) from exc


def _analyze_transcript_sync(transcript: str) -> MeetingIntelligence:
    client = _get_client()
    messages: list[dict] = [{"role": "user", "content": transcript}]

    response = _call_anthropic(client, messages)
    tool_input = _extract_tool_input(response)

    try:
        return _validate_tool_input(tool_input)
    except ValidationError as first_error:
        error_detail = json.dumps(first_error.errors(), default=str)
        retry_messages = [
            *messages,
            {"role": "assistant", "content": response.content},
            {
                "role": "user",
                "content": (
                    "Your previous tool output failed validation. "
                    f"Errors: {error_detail}. "
                    "Call extract_meeting_intelligence again with corrected output."
                ),
            },
        ]

        retry_response = _call_anthropic(client, retry_messages)
        retry_tool_input = _extract_tool_input(retry_response)

        try:
            return _validate_tool_input(retry_tool_input)
        except ValidationError as retry_error:
            raise HTTPException(
                status_code=502,
                detail=(
                    "LLM returned invalid structured output after retry: "
                    f"{retry_error.errors()}"
                ),
            ) from retry_error


async def analyze_transcript(transcript: str) -> MeetingIntelligence:
    if os.environ.get("MOCK_MODE", "false").lower() == "true":
        return MeetingIntelligence.model_validate({
            "meeting_title": "Mock Meeting Analysis",
            "summary": (
                "This is a mock summary generated without calling the Anthropic API. "
                "The team discussed project updates, blockers, and next steps. "
                "This response is for testing the UI flow only."
            ),
            "action_items": [
                {
                    "task": "Review the API contract",
                    "owner": "John",
                    "due_date": None,
                },
                {
                    "task": "Draft follow-up email to client",
                    "owner": "Mike",
                    "due_date": None,
                },
            ],
            "key_decisions": [
                "Postpone mobile app launch to next month",
            ],
            "open_questions": [
                "When will the Stripe webhook issue be resolved?",
            ],
            "participant_sentiment": [
                {
                    "participant": "Sarah",
                    "sentiment": "positive",
                    "notes": "Confident and on schedule",
                },
                {
                    "participant": "Mike",
                    "sentiment": "neutral",
                    "notes": "Facing a technical blocker",
                },
            ],
            "follow_up_email": {
                "subject": "Meeting Update - Mock Mode",
                "body": "Hi team,\n\nThis is a mock follow-up email generated in mock mode.\n\nBest,\nAI Assistant",
            },
        })
    return await asyncio.to_thread(_analyze_transcript_sync, transcript)