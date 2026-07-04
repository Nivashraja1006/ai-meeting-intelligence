from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"), index=True, nullable=False)
    task: Mapped[str] = mapped_column(String(1000), nullable=False)
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[str | None] = mapped_column(String(20), nullable=True)

    meeting: Mapped["Meeting"] = relationship(back_populates="action_items")
