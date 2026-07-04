from io import BytesIO

from fpdf import FPDF

from app.schemas.meeting import MeetingDetailResponse


class MeetingPDF(FPDF):
    def header(self) -> None:
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 10, "Meeting Intelligence Report", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")


def _section_title(pdf: FPDF, title: str) -> None:
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)


def _body_text(pdf: FPDF, text: str) -> None:
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, text)
    pdf.ln(2)


def _bullet_list(pdf: FPDF, items: list[str]) -> None:
    pdf.set_font("Helvetica", "", 10)
    if not items:
        pdf.multi_cell(0, 5, "None")
    else:
        for item in items:
            pdf.multi_cell(0, 5, f"- {item}")
    pdf.ln(2)


def generate_meeting_pdf(detail: MeetingDetailResponse) -> bytes:
    data = detail.data
    pdf = MeetingPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 14)
    pdf.multi_cell(0, 7, data.meeting_title)
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 5, f"Meeting ID: {detail.id}  |  Source: {detail.source}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(
        0,
        5,
        f"Created: {detail.created_at.strftime('%Y-%m-%d %H:%M UTC')}",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(4)

    _section_title(pdf, "Summary")
    _body_text(pdf, data.summary)

    _section_title(pdf, "Action Items")
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(80, 6, "Task", border=1)
    pdf.cell(40, 6, "Owner", border=1)
    pdf.cell(30, 6, "Due Date", border=1, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    if not data.action_items:
        pdf.cell(150, 6, "No action items recorded", border=1, new_x="LMARGIN", new_y="NEXT")
    else:
        for item in data.action_items:
            due = item.due_date or "TBD"
            pdf.cell(80, 6, item.task[:60], border=1)
            pdf.cell(40, 6, item.owner[:20], border=1)
            pdf.cell(30, 6, due, border=1, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    _section_title(pdf, "Key Decisions")
    _bullet_list(pdf, data.key_decisions)

    _section_title(pdf, "Open Questions")
    _bullet_list(pdf, data.open_questions)

    _section_title(pdf, "Follow-Up Email Draft")
    pdf.set_font("Helvetica", "B", 10)
    pdf.multi_cell(0, 5, f"Subject: {data.follow_up_email.subject}")
    pdf.ln(1)
    _body_text(pdf, data.follow_up_email.body)

    buffer = BytesIO()
    pdf.output(buffer)
    return buffer.getvalue()
