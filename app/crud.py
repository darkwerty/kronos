from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.gamification import calculate_level, xp_for_log
from app.models import Habit, HabitLog


class DuplicateNameError(Exception):
    pass


class InactiveHabitError(Exception):
    pass


def create_habit(db: Session, name: str, amount: float, unit: str) -> Habit:
    habit = Habit(name=name, amount=amount, unit=unit)
    db.add(habit)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateNameError(name)
    db.refresh(habit)
    return habit


def list_habits(db: Session, status: str | None = None) -> list[Habit]:
    query = db.query(Habit)
    if status is not None:
        query = query.filter(Habit.status == status)
    return query.order_by(Habit.id).all()


def get_habit(db: Session, habit_id: int) -> Habit | None:
    return db.get(Habit, habit_id)


def update_habit(
    db: Session,
    habit: Habit,
    name: str | None,
    amount: float | None,
    unit: str | None,
    status: str | None,
) -> Habit:
    if name is not None:
        habit.name = name
    if amount is not None:
        habit.amount = amount
    if unit is not None:
        habit.unit = unit
    if status is not None:
        habit.status = status
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateNameError(name)
    db.refresh(habit)
    return habit


def get_checklist(db: Session, target_date: str) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT h.id, h.name, h.amount, h.unit, h.status, h.current_xp, h.level,
                   l.amount_done, l.target_snapshot, l.unit_snapshot
            FROM habits h
            LEFT JOIN habit_logs l ON h.id = l.habit_id AND l.logged_date = :target_date
            WHERE h.status = 'ACTIVE'
            ORDER BY h.id
            """
        ),
        {"target_date": target_date},
    ).fetchall()

    items = []
    for row in rows:
        (
            habit_id,
            name,
            amount,
            unit,
            status,
            current_xp,
            level,
            amount_done,
            target_snapshot,
            unit_snapshot,
        ) = row

        if amount_done is None:
            percentage = 0
            progress_state = "NOT_LOGGED"
        else:
            goal = target_snapshot if target_snapshot else amount
            percentage = int((amount_done / goal) * 100) if goal else 100
            progress_state = "COMPLETED" if percentage >= 100 else "IN_PROGRESS"

        items.append(
            {
                "id": habit_id,
                "name": name,
                "amount": amount,
                "unit": unit,
                "status": status,
                "current_xp": current_xp,
                "level": level,
                "amount_done": amount_done,
                "target_snapshot": target_snapshot,
                "unit_snapshot": unit_snapshot,
                "percentage": percentage,
                "progress_state": progress_state,
            }
        )
    return items


def _apply_xp_delta(habit: Habit, delta: float) -> None:
    habit.current_xp = max(0, round(habit.current_xp + delta))
    habit.level = calculate_level(habit.current_xp)


def upsert_log(
    db: Session, habit: Habit, logged_date: str, amount_done: float | None
) -> HabitLog:
    if habit.status != "ACTIVE":
        raise InactiveHabitError(habit.status)

    if amount_done is None:
        amount_done = habit.amount

    existing = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit.id, HabitLog.logged_date == logged_date)
        .first()
    )

    if existing is not None:
        old_xp = xp_for_log(existing.amount_done, existing.target_snapshot)
        _apply_xp_delta(habit, -old_xp)

        existing.amount_done = amount_done
        existing.target_snapshot = habit.amount
        existing.unit_snapshot = habit.unit
        log = existing
    else:
        log = HabitLog(
            habit_id=habit.id,
            logged_date=logged_date,
            amount_done=amount_done,
            target_snapshot=habit.amount,
            unit_snapshot=habit.unit,
        )
        db.add(log)

    new_xp = xp_for_log(log.amount_done, log.target_snapshot)
    _apply_xp_delta(habit, new_xp)

    db.commit()
    db.refresh(log)
    db.refresh(habit)
    return log


def delete_log(db: Session, habit: Habit, logged_date: str) -> bool:
    log = (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit.id, HabitLog.logged_date == logged_date)
        .first()
    )
    if log is None:
        return False

    lost_xp = xp_for_log(log.amount_done, log.target_snapshot)
    _apply_xp_delta(habit, -lost_xp)

    db.delete(log)
    db.commit()
    db.refresh(habit)
    return True
