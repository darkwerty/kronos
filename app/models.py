from sqlalchemy import (
    REAL,
    Boolean,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    picture: Mapped[str | None] = mapped_column(String, nullable=True)
    provider: Mapped[str] = mapped_column(String, nullable=False, default="google")
    provider_user_id: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, nullable=False)

    habits: Mapped[list["Habit"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    categories: Mapped[list["Category"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False, default="#6366f1")
    icon: Mapped[str] = mapped_column(String, nullable=False, default="Tag")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )

    user: Mapped["User | None"] = relationship(back_populates="categories")
    habits: Mapped[list["Habit"]] = relationship(back_populates="category")


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(REAL, nullable=False, default=1.0)
    unit: Mapped[str] = mapped_column(String, nullable=False, default="check")
    status: Mapped[str] = mapped_column(String, nullable=False, default="ACTIVE")
    current_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    target_days: Mapped[str] = mapped_column(
        String, nullable=False, default="1,2,3,4,5,6,7"
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, default=1
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )

    user: Mapped["User | None"] = relationship(back_populates="habits")
    category: Mapped["Category | None"] = relationship(back_populates="habits")
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


