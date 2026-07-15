from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.schemas import ChecklistItem, HabitCreate, HabitOut, HabitUpdate, Status

router = APIRouter(prefix="/habits", tags=["habits"])


@router.post("", response_model=HabitOut, status_code=201)
def create_habit(payload: HabitCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_habit(db, payload.name, payload.amount, payload.unit)
    except crud.DuplicateNameError:
        raise HTTPException(status_code=400, detail="A habit with that name already exists.")


@router.get("", response_model=list[HabitOut])
def list_habits(status: Optional[Status] = Query(default=None), db: Session = Depends(get_db)):
    return crud.list_habits(db, status)


@router.get("/checklist", response_model=list[ChecklistItem])
def get_checklist(target_date: date = Query(default_factory=date.today), db: Session = Depends(get_db)):
    return crud.get_checklist(db, target_date.isoformat())


@router.get("/{habit_id}", response_model=HabitOut)
def get_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = crud.get_habit(db, habit_id)
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found.")
    return habit


@router.patch("/{habit_id}", response_model=HabitOut)
def update_habit(habit_id: int, payload: HabitUpdate, db: Session = Depends(get_db)):
    habit = crud.get_habit(db, habit_id)
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found.")
    try:
        return crud.update_habit(
            db, habit, payload.name, payload.amount, payload.unit, payload.status
        )
    except crud.DuplicateNameError:
        raise HTTPException(status_code=400, detail="A habit with that name already exists.")
