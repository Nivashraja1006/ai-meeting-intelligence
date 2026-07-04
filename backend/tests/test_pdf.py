"""Tests for PDF export."""

from app.models.user import User
from app.services.meeting_service import get_meeting, save_meeting
from app.services.pdf_service import generate_meeting_pdf


def test_generate_meeting_pdf_returns_valid_pdf_bytes(db_session):
    user = User(email="pdf@example.com", hashed_password="hashed")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    meeting = save_meeting(db_session, user, SAMPLE_TRANSCRIPT, "text", SAMPLE_INTELLIGENCE)
    detail = get_meeting(db_session, user, meeting.id)

    pdf_bytes = generate_meeting_pdf(detail)
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 500


def test_export_pdf_endpoint(client, auth_headers, db_session):
    user = db_session.query(User).filter(User.email == "test@example.com").one()
    meeting = save_meeting(db_session, user, SAMPLE_TRANSCRIPT, "text", SAMPLE_INTELLIGENCE)

    response = client.get(f"/meetings/{meeting.id}/export-pdf", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_export_pdf_not_found(client, auth_headers):
    response = client.get("/meetings/9999/export-pdf", headers=auth_headers)
    assert response.status_code == 404
