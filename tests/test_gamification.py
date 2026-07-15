import pytest

from app.gamification import calculate_level, xp_for_log


@pytest.mark.parametrize(
    "amount_done,target,expected",
    [
        (0, 10, 0.0),
        (5, 10, 5.0),
        (10, 10, 10.0),
        (15, 10, 10.0),  # capped at flat 10 XP once >= 100%
        (1, 4, 2.5),
    ],
)
def test_xp_for_log_ratios(amount_done, target, expected):
    assert xp_for_log(amount_done, target) == expected


def test_xp_for_log_binary_habit_with_zero_target():
    assert xp_for_log(1, 0) == 10.0
    assert xp_for_log(0, 0) == 0.0


@pytest.mark.parametrize(
    "total_xp,expected_level",
    [
        (0, 1),
        (99, 1),
        (100, 2),  # level 1 -> 2 threshold
        (299, 2),
        (300, 3),  # level 2 -> 3 threshold (100 + 200)
        (599, 3),
        (600, 4),  # level 3 -> 4 threshold (100 + 200 + 300)
    ],
)
def test_calculate_level_thresholds(total_xp, expected_level):
    assert calculate_level(total_xp) == expected_level
