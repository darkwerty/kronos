from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.gamification import (
    calculate_level,
    calculate_streak,
    get_rank_title,
    xp_for_log,
)
from app.models import Category, Habit, HabitLog


class DuplicateNameError(Exception):
    pass


class InactiveHabitError(Exception):
    pass


DEFAULT_CATEGORIES = [
    {"name": "General", "color": "#6b7280", "icon": "Tag", "is_default": True},
    {"name": "Salud", "color": "#10b981", "icon": "HeartPulse", "is_default": True},
    {"name": "Deporte", "color": "#14b8a6", "icon": "Flame", "is_default": True},
    {"name": "Trabajo", "color": "#6366f1", "icon": "Briefcase", "is_default": True},
    {"name": "Mente", "color": "#8b5cf6", "icon": "Brain", "is_default": True},
    {"name": "Finanzas", "color": "#f59e0b", "icon": "Wallet", "is_default": True},
    {"name": "Rutina", "color": "#06b6d4", "icon": "Home", "is_default": True},
]

OLD_CATEGORY_RENAMES = {
    "Salud & Deporte": "Salud",
    "Trabajo & Estudio": "Trabajo",
    "Mente & Bienestar": "Mente",
    "Rutina & Hogar": "Rutina",
}


def match_category_by_name(habit_name: str, categories_map: dict[str, int]) -> int | None:
    name_lower = habit_name.lower()

    deporte_keywords = ["pushup", "flexion", "swim", "nado", "nadar", "run", "correr", "gym", "deporte", "ejercicio", "fit", "entrenar"]
    salud_keywords = ["walk", "caminar", "pasos", "agua", "water", "salud", "sueño", "sleep", "dieta"]
    trabajo_keywords = ["job", "work", "program", "code", "coding", "estud", "study", "read", "leer", "trabaj", "curso", "learn", "aprender", "proyecto"]
    mente_keywords = ["meditat", "meditar", "journal", "diario", "mind", "mente", "respira", "yoga", "lectura", "paz"]
    finanzas_keywords = ["finanz", "ahorr", "save", "money", "presupuesto", "gasto", "dinero", "inversion"]
    rutina_keywords = ["limp", "clean", "hogar", "home", "rutina", "ordenar", "cocinar"]

    if any(k in name_lower for k in deporte_keywords):
        return categories_map.get("Deporte") or categories_map.get("Salud")
    if any(k in name_lower for k in salud_keywords):
        return categories_map.get("Salud")
    if any(k in name_lower for k in trabajo_keywords):
        return categories_map.get("Trabajo")
    if any(k in name_lower for k in mente_keywords):
        return categories_map.get("Mente")
    if any(k in name_lower for k in finanzas_keywords):
        return categories_map.get("Finanzas")
    if any(k in name_lower for k in rutina_keywords):
        return categories_map.get("Rutina")

    return categories_map.get("General")


def seed_default_categories(db: Session) -> list[Category]:
    for old_name, new_name in OLD_CATEGORY_RENAMES.items():
        old_cat = db.query(Category).filter(Category.name == old_name).first()
        if old_cat:
            existing_new = db.query(Category).filter(Category.name == new_name).first()
            if not existing_new:
                old_cat.name = new_name
            db.commit()

    for cat_data in DEFAULT_CATEGORIES:
        existing = (
            db.query(Category)
            .filter(Category.name == cat_data["name"], Category.user_id == None)
            .first()
        )
        if not existing:
            cat = Category(**cat_data)
            db.add(cat)
    db.commit()

    categories = (
        db.query(Category).filter(Category.user_id == None).order_by(Category.id).all()
    )
    categories_map = {c.name: c.id for c in categories}
    general_id = categories_map.get("General", 1)

    habits = (
        db.query(Habit)
        .filter((Habit.category_id == None) | (Habit.category_id == general_id))
        .all()
    )
    updated = False
    for h in habits:
        matched_id = match_category_by_name(h.name, categories_map)
        if matched_id and matched_id != h.category_id:
            h.category_id = matched_id
            updated = True
    if updated:
        db.commit()

    return categories


def list_categories(db: Session, user_id: int | None = None) -> list[Category]:
    seed_default_categories(db)
    query = db.query(Category).filter(
        (Category.is_default == True) | (Category.user_id == user_id)
    )
    return query.order_by(Category.id).all()


def create_category(
    db: Session, name: str, color: str, icon: str, user_id: int | None = None
) -> Category:
    existing = (
        db.query(Category)
        .filter(Category.name == name, Category.user_id == user_id)
        .first()
    )
    if existing:
        raise DuplicateNameError(name)

    category = Category(
        name=name, color=color, icon=icon, is_default=False, user_id=user_id
    )
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateNameError(name)
    db.refresh(category)
    return category


def get_default_category_id(db: Session) -> int | None:
    categories = seed_default_categories(db)
    general_cat = next((c for c in categories if c.name == "General"), None)
    if general_cat:
        return general_cat.id
    return categories[0].id if categories else None


def create_habit(
    db: Session,
    name: str,
    amount: float,
    unit: str,
    category_id: int | None = None,
    target_days: str | None = "1,2,3,4,5,6,7",
    user_id: int | None = None,
) -> Habit:
    existing = (
        db.query(Habit)
        .filter(Habit.name == name, Habit.user_id == user_id)
        .first()
    )
    if existing:
        raise DuplicateNameError(name)

    if category_id is None:
        categories = list_categories(db, user_id=user_id)
        categories_map = {c.name: c.id for c in categories}
        category_id = match_category_by_name(name, categories_map)

    habit = Habit(
        name=name,
        amount=amount,
        unit=unit,
        category_id=category_id,
        target_days=target_days or "1,2,3,4,5,6,7",
        user_id=user_id,
    )

    db.add(habit)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateNameError(name)
    db.refresh(habit)
    habit.streak = 0
    habit.rank_title = get_rank_title(habit.level)
    return habit

def list_habits(
    db: Session,
    user_id: int | None = None,
    status: str | None = None,
    category_id: int | None = None,
) -> list[Habit]:
    query = db.query(Habit)
    if user_id is not None:
        query = query.filter((Habit.user_id == user_id) | (Habit.user_id == None))
    else:
        query = query.filter(Habit.user_id == None)

    if status is not None:
        query = query.filter(Habit.status == status)
    if category_id is not None:
        query = query.filter(Habit.category_id == category_id)

    habits = query.order_by(Habit.id).all()
    for h in habits:
        h.streak = calculate_streak(db, h.id)
        h.rank_title = get_rank_title(h.level)
    return habits


def get_habit(db: Session, habit_id: int, user_id: int | None = None) -> Habit | None:
    query = db.query(Habit).filter(Habit.id == habit_id)
    if user_id is not None:
        query = query.filter((Habit.user_id == user_id) | (Habit.user_id == None))
    else:
        query = query.filter(Habit.user_id == None)

    habit = query.first()
    if habit:
        habit.streak = calculate_streak(db, habit.id)
        habit.rank_title = get_rank_title(habit.level)
    return habit


def update_habit(
    db: Session,
    habit: Habit,
    name: str | None,
    amount: float | None,
    unit: str | None,
    status: str | None,
    category_id: int | None = None,
    target_days: str | None = None,
) -> Habit:
    if name is not None and name != habit.name:
        collision = (
            db.query(Habit)
            .filter(
                Habit.name == name,
                Habit.user_id == habit.user_id,
                Habit.id != habit.id,
            )
            .first()
        )
        if collision:
            raise DuplicateNameError(name)
        habit.name = name
    if amount is not None:
        habit.amount = amount
    if unit is not None:
        habit.unit = unit
    if status is not None:
        habit.status = status
    if category_id is not None:
        habit.category_id = category_id
    if target_days is not None:
        habit.target_days = target_days
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateNameError(name)
    db.refresh(habit)
    habit.streak = calculate_streak(db, habit.id)
    habit.rank_title = get_rank_title(habit.level)
    return habit


def get_checklist(
    db: Session,
    target_date: str,
    user_id: int | None = None,
    include_unscheduled: bool = False,
) -> list[dict]:
    from datetime import date

    target_iso_day = str(date.fromisoformat(target_date).isoweekday())

    if user_id is not None:
        user_clause = "(h.user_id = :user_id OR h.user_id IS NULL)"
    else:
        user_clause = "h.user_id IS NULL"

    query_str = f"""
        SELECT h.id, h.name, h.amount, h.unit, h.status, h.current_xp, h.level, h.target_days, h.category_id,
               c.name AS category_name, c.color AS category_color, c.icon AS category_icon, c.is_default AS category_is_default,
               l.amount_done, l.target_snapshot, l.unit_snapshot
        FROM habits h
        LEFT JOIN categories c ON h.category_id = c.id
        LEFT JOIN habit_logs l ON h.id = l.habit_id AND l.logged_date = :target_date
        WHERE h.status = 'ACTIVE' AND {user_clause}
        ORDER BY h.id
    """

    params = {"target_date": target_date}
    if user_id is not None:
        params["user_id"] = user_id

    rows = db.execute(text(query_str), params).fetchall()

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
            target_days,
            category_id,
            cat_name,
            cat_color,
            cat_icon,
            cat_is_default,
            amount_done,
            target_snapshot,
            unit_snapshot,
        ) = row

        scheduled_days = [
            d.strip() for d in (target_days or "1,2,3,4,5,6,7").split(",") if d.strip()
        ]
        is_scheduled = target_iso_day in scheduled_days

        if not is_scheduled and amount_done is None and not include_unscheduled:
            continue

        category_obj = (
            {
                "id": category_id,
                "name": cat_name,
                "color": cat_color,
                "icon": cat_icon,
                "is_default": bool(cat_is_default) if cat_is_default is not None else False,
            }
            if category_id and cat_name
            else None
        )

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
                "target_days": target_days or "1,2,3,4,5,6,7",
                "is_scheduled": is_scheduled,
                "category_id": category_id,
                "category": category_obj,
                "amount_done": amount_done,
                "target_snapshot": target_snapshot,
                "unit_snapshot": unit_snapshot,
                "percentage": percentage,
                "progress_state": progress_state,
                "streak": calculate_streak(db, habit_id, target_date),
                "rank_title": get_rank_title(level),
            }
        )
    return items


def get_category_analytics(db: Session, user_id: int | None = None) -> list[dict]:
    categories = list_categories(db, user_id=user_id)
    result = []

    for cat in categories:
        query = db.query(Habit).filter(Habit.category_id == cat.id)
        if user_id is not None:
            query = query.filter(Habit.user_id == user_id)
        else:
            query = query.filter(Habit.user_id == None)

        habits = query.all()
        total_xp = sum(h.current_xp for h in habits)
        habit_count = len(habits)

        completed_logs = 0
        total_logs = 0
        if habit_count > 0:
            habit_ids = [h.id for h in habits]
            logs = db.query(HabitLog).filter(HabitLog.habit_id.in_(habit_ids)).all()
            total_logs = len(logs)
            completed_logs = sum(
                1 for l in logs if l.amount_done >= (l.target_snapshot or 1.0)
            )

        completion_rate = (
            int((completed_logs / total_logs) * 100) if total_logs > 0 else 0
        )

        result.append(
            {
                "category_id": cat.id,
                "category_name": cat.name,
                "category_color": cat.color,
                "category_icon": cat.icon,
                "total_xp": total_xp,
                "habit_count": habit_count,
                "total_logs": total_logs,
                "completed_logs": completed_logs,
                "completion_rate": completion_rate,
            }
        )

    return result


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
