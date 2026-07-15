from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["ACTIVE", "PAUSED", "ARCHIVED"]
ProgressState = Literal["NOT_LOGGED", "IN_PROGRESS", "COMPLETED"]


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    amount: float = Field(default=1.0, gt=0)
    unit: str = Field(default="check", min_length=1)


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    amount: Optional[float] = Field(default=None, gt=0)
    unit: Optional[str] = Field(default=None, min_length=1)
    status: Optional[Status] = None


class HabitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    amount: float
    unit: str
    status: Status
    current_xp: int
    level: int


class ChecklistItem(BaseModel):
    id: int
    name: str
    amount: float
    unit: str
    status: Status
    current_xp: int
    level: int
    amount_done: Optional[float] = None
    target_snapshot: Optional[float] = None
    unit_snapshot: Optional[str] = None
    percentage: int
    progress_state: ProgressState


class LogCreate(BaseModel):
    logged_date: date
    amount_done: Optional[float] = None


class LogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    habit_id: int
    logged_date: str
    amount_done: float
    target_snapshot: float
    unit_snapshot: str
    habit_current_xp: int
    habit_level: int
