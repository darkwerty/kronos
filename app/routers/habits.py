from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import auth, crud
from app.database import get_db
from app.models import User
from app.schemas import ChecklistItem, HabitCreate, HabitOut, HabitUpdate, Status

router = APIRouter(prefix="/habits", tags=["habits"])


@router.post("", response_model=HabitOut, status_code=201)
def create_habit(
    payload: HabitCreate,
    current_user: Optional[User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    try:
        return crud.create_habit(
            db,
            payload.name,
            payload.amount,
            payload.unit,
            payload.category_id,
            payload.target_days,
            user_id=user_id,
        )
    except crud.DuplicateNameError:
        raise HTTPException(
            status_code=400, detail="Ya existe un hábito con ese nombre."
        )


@router.get("", response_model=list[HabitOut])
def list_habits(
    status: Optional[Status] = Query(default=None),
    category_id: Optional[int] = Query(default=None),
    current_user: Optional[User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    return crud.list_habits(
        db, user_id=user_id, status=status, category_id=category_id
    )


@router.get("/checklist", response_model=list[ChecklistItem])
def get_checklist(
    target_date: date = Query(default_factory=date.today),
    include_unscheduled: bool = Query(default=False),
    current_user: Optional[User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    return crud.get_checklist(
        db,
        target_date.isoformat(),
        user_id=user_id,
        include_unscheduled=include_unscheduled,
    )


@router.get("/{habit_id}", response_model=HabitOut)
def get_habit(
    habit_id: int,
    current_user: Optional[User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    habit = crud.get_habit(db, habit_id, user_id=user_id)
    if habit is None:
        raise HTTPException(status_code=404, detail="Hábito no encontrado.")
    return habit


@router.patch("/{habit_id}", response_model=HabitOut)
def update_habit(
    habit_id: int,
    payload: HabitUpdate,
    current_user: Optional[User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    habit = crud.get_habit(db, habit_id, user_id=user_id)
    if habit is None:
        raise HTTPException(status_code=404, detail="Hábito no encontrado.")
    try:
        return crud.update_habit(
            db,
            habit,
            payload.name,
            payload.amount,
            payload.unit,
            payload.status,
            payload.category_id,
            payload.target_days,
        )
    except crud.DuplicateNameError:
        raise HTTPException(
            status_code=400, detail="Ya existe un hábito con ese nombre."
        )


@router.patch("/{habit_id}/archive", response_model=HabitOut)
def archive_habit(
    habit_id: int,
    current_user: Optional[User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db),
):
    user_id = current_user.id if current_user else None
    habit = crud.get_habit(db, habit_id, user_id=user_id)
    if habit is None:
        raise HTTPException(status_code=404, detail="Hábito no encontrado.")
    return crud.update_habit(
        db,
        habit,
        name=None,
        amount=None,
        unit=None,
        status="ARCHIVED",
        category_id=None,
        target_days=None,
    )


