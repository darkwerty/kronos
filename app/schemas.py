from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["ACTIVE", "PAUSED", "ARCHIVED"]
ProgressState = Literal["NOT_LOGGED", "IN_PROGRESS", "COMPLETED"]


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(default="#6366f1", max_length=20)
    icon: str = Field(default="Tag", max_length=50)


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color: str
    icon: str
    is_default: bool


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    amount: float = Field(default=1.0, gt=0)
    unit: str = Field(default="check", min_length=1)
    category_id: Optional[int] = None
    target_days: Optional[str] = Field(default="1,2,3,4,5,6,7")


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    amount: Optional[float] = Field(default=None, gt=0)
    unit: Optional[str] = Field(default=None, min_length=1)
    status: Optional[Status] = None
    category_id: Optional[int] = None
    target_days: Optional[str] = None


class HabitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    amount: float
    unit: str
    status: Status
    current_xp: int
    level: int
    target_days: str = "1,2,3,4,5,6,7"
    category_id: Optional[int] = None
    category: Optional[CategoryOut] = None
    streak: int = 0
    rank_title: str = "Novato 🥉"


class ChecklistItem(BaseModel):
    id: int
    name: str
    amount: float
    unit: str
    status: Status
    current_xp: int
    level: int
    target_days: str = "1,2,3,4,5,6,7"
    is_scheduled: bool = True
    category_id: Optional[int] = None
    category: Optional[CategoryOut] = None
    amount_done: Optional[float] = None
    target_snapshot: Optional[float] = None
    unit_snapshot: Optional[str] = None
    percentage: int
    progress_state: ProgressState
    streak: int = 0
    rank_title: str = "Novato 🥉"




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


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    provider: str
    created_at: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class GoogleLoginRequest(BaseModel):
    id_token: str


class GithubLoginRequest(BaseModel):
    code: str


class SyncGuestHabitsRequest(BaseModel):
    habit_ids: list[int]


