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
