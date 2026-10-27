from datetime import datetime, timedelta, timezone

import pytest

from app.services.volume import weekly_volume, muscles_below_anchor

NOW = datetime(2026, 10, 27, 12, 0, tzinfo=timezone.utc)


def make_set(primary, secondary, hours_ago):
    return {
        "primary_muscle": primary,
        "secondary_muscles": secondary,
        "performed_at": NOW - timedelta(hours=hours_ago),
    }


# --- weekly_volume ---

def test_primary_only_set_counts_one():
    result = weekly_volume([make_set("chest", [], 5)], NOW)
    assert result == {"chest": 1.0}


def test_secondary_muscles_get_half_credit():
    result = weekly_volume([make_set("chest", ["triceps", "shoulders"], 5)], NOW)
    assert result == {"chest": 1.0, "triceps": 0.5, "shoulders": 0.5}


def test_primary_and_secondary_across_sets_sum():
    sets = [
        make_set("triceps", [], 5),
        make_set("chest", ["triceps"], 10),
    ]
    result = weekly_volume(sets, NOW)
    assert result["triceps"] == 1.5


def test_set_older_than_seven_days_is_ignored():
    result = weekly_volume([make_set("chest", [], 24 * 8)], NOW)
    assert result == {}


def test_set_exactly_seven_days_old_is_excluded():
    result = weekly_volume([make_set("chest", [], 24 * 7)], NOW)
    assert result == {}


def test_empty_input_returns_empty_dict():
    assert weekly_volume([], NOW) == {}


# --- muscles_below_anchor ---

def test_untrained_muscle_is_flagged_with_full_anchor():
    result = muscles_below_anchor({}, ["chest"], "hypertrophy")
    assert result == {"chest": 10.5}


def test_muscle_at_anchor_is_not_flagged():
    result = muscles_below_anchor({"chest": 10.5}, ["chest"], "hypertrophy")
    assert result == {}


def test_muscle_below_anchor_reports_shortfall():
    result = muscles_below_anchor({"chest": 8.0}, ["chest"], "hypertrophy")
    assert result == {"chest": 2.5}


def test_strength_goal_uses_strength_anchor():
    result = muscles_below_anchor({"chest": 4.0}, ["chest"], "strength")
    assert result == {"chest": 2.0}


def test_only_listed_muscles_are_checked():
    result = muscles_below_anchor({"back": 2.0}, ["chest"], "hypertrophy")
    assert list(result) == ["chest"]


def test_general_goal_flags_nothing():
    assert muscles_below_anchor({}, ["chest"], "general") == {}


def test_unknown_goal_raises():
    with pytest.raises(ValueError):
        muscles_below_anchor({}, ["chest"], "bulking")