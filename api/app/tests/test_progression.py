"""
Tests for progression.py -- suggest_next() decision branches.
"""

import pytest

from app.services.progression import suggest_next

HYPER_RANGE = {"rep_range_min": 8, "rep_range_max": 12}
STRENGTH_RANGE = {"rep_range_min": 3, "rep_range_max": 6}


def make_sets(weight_kg, reps, rir, n=3):
    return [{"weight_kg": weight_kg, "reps": reps, "rir": rir} for _ in range(n)]


def test_empty_history_raises():
    with pytest.raises(ValueError):
        suggest_next(HYPER_RANGE, [], "hypertrophy", "intermediate")


def test_strength_above_target_adds_weight():
    # avg RIR 5 > strength target max 4; intermediate increment is 5%
    result = suggest_next(
        STRENGTH_RANGE, make_sets(100, 5, 5), "strength", "intermediate"
    )
    assert result["suggested_weight_kg"] == pytest.approx(105.0)
    assert result["suggested_reps"] == 5
    assert "currier2023" in result["basis"]


def test_hypertrophy_above_target_adds_rep_when_room():
    # avg RIR 4 > hypertrophy target max 2, reps 8 < range max 12
    result = suggest_next(
        HYPER_RANGE, make_sets(60, 8, 4), "hypertrophy", "intermediate"
    )
    assert result["suggested_weight_kg"] == 60
    assert result["suggested_reps"] == 9
    assert "schoenfeld2021" in result["basis"]


def test_hypertrophy_at_rep_ceiling_adds_weight_and_resets_reps():
    result = suggest_next(
        HYPER_RANGE, make_sets(60, 12, 4), "hypertrophy", "intermediate"
    )
    assert result["suggested_weight_kg"] == pytest.approx(63.0)
    assert result["suggested_reps"] == 8


def test_below_target_holds():
    # general target is (1, 3); avg RIR 0 is below it
    result = suggest_next(HYPER_RANGE, make_sets(60, 10, 0), "general", "intermediate")
    assert result["suggested_weight_kg"] == 60
    assert result["suggested_reps"] == 10


def test_inside_target_holds():
    result = suggest_next(
        HYPER_RANGE, make_sets(60, 10, 1), "hypertrophy", "intermediate"
    )
    assert result["suggested_weight_kg"] == 60
    assert result["suggested_reps"] == 10


def test_novice_target_overrides_goal_target():
    sets = make_sets(60, 10, 3)
    # RIR 3 is above the hypertrophy target (0-2) -> intermediate progresses
    intermediate = suggest_next(HYPER_RANGE, sets, "hypertrophy", "intermediate")
    assert intermediate["suggested_reps"] == 11
    # RIR 3 is inside the novice target (2-3) -> novice holds
    novice = suggest_next(HYPER_RANGE, sets, "hypertrophy", "novice")
    assert novice["suggested_reps"] == 10
    assert novice["suggested_weight_kg"] == 60


def test_reps_never_exceed_rep_range():
    # last set was 14 reps, outside the 8-12 range; output must be clamped
    result = suggest_next(
        HYPER_RANGE, make_sets(60, 14, 2), "hypertrophy", "intermediate"
    )
    assert HYPER_RANGE["rep_range_min"] <= result["suggested_reps"] <= HYPER_RANGE["rep_range_max"]


def test_strength_floor_flag_set_when_below_80_pct():
    # 50kg x 10 -> est. 1RM about 71kg, floor about 57kg, so 50kg is below
    result = suggest_next(HYPER_RANGE, make_sets(50, 10, 0), "strength", "intermediate")
    assert result["below_strength_load_floor"] is True
    # the engine must not override the user's weight to chase the floor
    assert result["suggested_weight_kg"] == 50


def test_strength_floor_flag_clear_when_above_80_pct():
    # 60kg x 5 -> est. 1RM about 72kg, floor about 58kg, so 60kg clears it
    result = suggest_next(STRENGTH_RANGE, make_sets(60, 5, 0), "strength", "intermediate")
    assert result["below_strength_load_floor"] is False
