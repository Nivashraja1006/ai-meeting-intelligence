"""Tests for forced tool_use schema validation and malformed LLM output handling."""
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.services.anthropic_service import (
    EXTRACT_MEETING_INTELLIGENCE_TOOL,
    _analyze_transcript_sync,
    _extract_tool_input,
    _validate_tool_input,
)

VALID_TOOL_INPUT = {
    "meeting_title": "Sprint Planning",
    "summary": "The team reviewed priorities and assigned owners for key tasks.",
    "action_items": [
        {"task": "Ship API", "owner": "Mike", "due_date": "2026-03-15"},
    ],
    "key_decisions": ["Launch MVP without analytics"],
    "open_questions": ["Need legal review?"],
    "participant_sentiment": [
        {"participant": "Sarah", "sentiment": "positive", "notes": "Decisive facilitator"}
    ],
    "follow_up_email": {
        "subject": "Sprint Planning Follow-Up",
        "body": "Hi team,\n\nSee summary below.\n\nThanks",
    },
}


def test_tool_schema_has_required_fields():
    required = EXTRACT_MEETING_INTELLIGENCE_TOOL["input_schema"]["required"]
    assert "meeting_title" in required
    assert "follow_up_email" in required
    assert EXTRACT_MEETING_INTELLIGENCE_TOOL["name"] == "extract_meeting_intelligence"


def test_validate_tool_input_accepts_valid_payload():
    result = _validate_tool_input(VALID_TOOL_INPUT)
    assert result.meeting_title == "Sprint Planning"
    assert len(result.action_items) == 1


def test_validate_tool_input_rejects_invalid_sentiment():
    invalid = {**VALID_TOOL_INPUT}
    invalid["participant_sentiment"] = [
        {"participant": "Sarah", "sentiment": "excited", "notes": "Invalid enum"}
    ]
    with pytest.raises(ValidationError):
        _validate_tool_input(invalid)


def test_validate_tool_input_rejects_missing_required_field():
    incomplete = {k: v for k, v in VALID_TOOL_INPUT.items() if k != "summary"}
    with pytest.raises(ValidationError):
        _validate_tool_input(incomplete)


def test_extract_tool_input_raises_when_no_tool_use_block():
    response = MagicMock()
    response.content = [MagicMock(type="text", text="freeform response")]
    with pytest.raises(HTTPException) as exc_info:
        _extract_tool_input(response)
    assert exc_info.value.status_code == 502


def _mock_message(tool_input: dict) -> MagicMock:
    block = MagicMock()
    block.type = "tool_use"
    block.name = "extract_meeting_intelligence"
    block.input = tool_input
    message = MagicMock()
    message.content = [block]
    return message


@patch("app.services.anthropic_service._get_client")
@patch("app.services.anthropic_service._call_anthropic")
def test_analyze_retries_once_on_validation_failure(mock_call, mock_client):
    invalid = {**VALID_TOOL_INPUT, "summary": 123}
    mock_call.side_effect = [
        _mock_message(invalid),
        _mock_message(VALID_TOOL_INPUT),
    ]
    mock_client.return_value = MagicMock()

    result = _analyze_transcript_sync("Sample transcript long enough for analysis purposes here.")
    assert result.meeting_title == "Sprint Planning"
    assert mock_call.call_count == 2


@patch("app.services.anthropic_service._get_client")
@patch("app.services.anthropic_service._call_anthropic")
def test_analyze_returns_502_after_retry_still_invalid(mock_call, mock_client):
    invalid = {**VALID_TOOL_INPUT, "summary": 123}
    mock_call.side_effect = [_mock_message(invalid), _mock_message(invalid)]
    mock_client.return_value = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        _analyze_transcript_sync("Sample transcript long enough for analysis purposes here.")
    assert exc_info.value.status_code == 502
    assert "after retry" in exc_info.value.detail
