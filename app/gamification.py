from datetime import date, timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session

FLAT_XP_ON_COMPLETION = 10.0
XP_PER_LEVEL_MULTIPLIER = 100


def xp_for_log(amount_done: float, target_snapshot: float) -> float:
    """XP earned by a single log entry: flat 10 XP at >=100% of target, linear below it."""
    if target_snapshot <= 0:
        return FLAT_XP_ON_COMPLETION if amount_done > 0 else 0.0

    ratio = amount_done / target_snapshot
    if ratio >= 1:
        return FLAT_XP_ON_COMPLETION
    return max(ratio, 0.0) * FLAT_XP_ON_COMPLETION


def calculate_level(total_xp: float) -> int:
    """Level is a pure function of total accumulated XP: level L needs L*100 XP to reach L+1."""
    level = 1
    remaining = total_xp
    while remaining >= level * XP_PER_LEVEL_MULTIPLIER:
        remaining -= level * XP_PER_LEVEL_MULTIPLIER
        level += 1
    return level


def get_rank_title(level: int) -> str:
    """Returns gamified rank title based on level."""
    if level >= 20:
        return "Titán 👑"
    elif level >= 10:
        return "Maestro 💎"
    elif level >= 5:
        return "Especialista 🥇"
    elif level >= 2:
        return "Aprendiz 🥈"
    return "Novato 🥉"


def calculate_streak(db: Session, habit_id: int, reference_date_str: str | None = None) -> int:
    """Calculates continuous completion streak leading up to target date."""
    if not reference_date_str:
        reference_date_str = date.today().isoformat()

    rows = db.execute(
        text(
            """
            SELECT logged_date, amount_done, target_snapshot
            FROM habit_logs
            WHERE habit_id = :habit_id AND logged_date <= :ref_date
            ORDER BY logged_date DESC
            """
        ),
        {"habit_id": habit_id, "ref_date": reference_date_str},
    ).fetchall()

    if not rows:
        return 0

    completion_map = {}
    for r_date, r_done, r_target in rows:
        goal = r_target if r_target > 0 else 1.0
        completion_map[r_date] = (r_done >= goal)

    try:
        current_dt = date.fromisoformat(reference_date_str)
    except ValueError:
        return 0

    streak = 0
    # Check if target date is logged
    if current_dt.isoformat() in completion_map:
        if completion_map[current_dt.isoformat()]:
            streak += 1
            check_dt = current_dt - timedelta(days=1)
        else:
            # Target date is logged but incomplete -> streak is 0
            return 0
    else:
        # Target date not logged yet -> start checking from yesterday
        check_dt = current_dt - timedelta(days=1)

    while check_dt.isoformat() in completion_map and completion_map[check_dt.isoformat()]:
        streak += 1
        check_dt -= timedelta(days=1)

    return streak

