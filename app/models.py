from sqlalchemy import (
    REAL,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    amount: Mapped[float] = mapped_column(REAL, nullable=False, default=1.0)
    unit: Mapped[str] = mapped_column(String, nullable=False, default="check")
    status: Mapped[str] = mapped_column(String, nullable=False, default="ACTIVE")
    current_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    logs: Mapped[list["HabitLog"]] = relationship(
        back_populates="habit", cascade="all, delete-orphan"
    )


class HabitLog(Base):
    __tablename__ = "habit_logs"
    __table_args__ = (UniqueConstraint("habit_id", "logged_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    habit_id: Mapped[int] = mapped_column(
        ForeignKey("habits.id", ondelete="CASCADE"), nullable=False
    )
    logged_date: Mapped[str] = mapped_column(String, nullable=False)
    amount_done: Mapped[float] = mapped_column(REAL, nullable=False)
    target_snapshot: Mapped[float] = mapped_column(REAL, nullable=False)
    unit_snapshot: Mapped[str] = mapped_column(String, nullable=False)

    habit: Mapped["Habit"] = relationship(back_populates="logs")
