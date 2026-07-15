from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.schemas import LogCreate, LogOut

router = APIRouter(prefix="/habits/{habit_id}/logs", tags=["logs"])


def _get_habit_or_404(db: Session, habit_id: int):
    habit = crud.get_habit(db, habit_id)
    if habit is None:
        raise HTTPException(status_code=404, detail="Habit not found.")
    return habit


def _to_log_out(log, habit) -> dict:
    return {
        "id": log.id,
        "habit_id": log.habit_id,
        "logged_date": log.logged_date,
        "amount_done": log.amount_done,
        "target_snapshot": log.target_snapshot,
        "unit_snapshot": log.unit_snapshot,
        "habit_current_xp": habit.current_xp,
        "habit_level": habit.level,
    }


@router.post("", response_model=LogOut, status_code=201)
def create_or_update_log(habit_id: int, payload: LogCreate, db: Session = Depends(get_db)):
    habit = _get_habit_or_404(db, habit_id)
    try:
        log = crud.upsert_log(db, habit, payload.logged_date.isoformat(), payload.amount_done)
    except crud.InactiveHabitError:
        raise HTTPException(
            status_code=400, detail=f"Cannot log progress on a {habit.status} habit."
        )
    return _to_log_out(log, habit)


@router.delete("/{logged_date}", status_code=204)
def delete_log(habit_id: int, logged_date: date, db: Session = Depends(get_db)):
    habit = _get_habit_or_404(db, habit_id)
    deleted = crud.delete_log(db, habit, logged_date.isoformat())
    if not deleted:
        raise HTTPException(status_code=404, detail="Log not found for that date.")
