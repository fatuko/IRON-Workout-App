from datetime import datetime, timedelta, timezone

from app.services.recovery import muscles_in_recovery

NOW = datetime(2026, 10, 26, 12, 0, tzinfo=timezone.utc)


def make_set(muscle, rir, session, hours_ago):
    return {
        "muscle_group": muscle,
        "rir": rir,
        "session_id": session,
        "performed_at": NOW - timedelta(hours=hours_ago),
    }


def test_two_failures_in_one_session_locks_muscle():
    sets = [make_set("chest", 0, "s1", 24), make_set("chest", 0, "s1", 24)]
    result = muscles_in_recovery(sets, NOW)
    assert result == {"chest": NOW - timedelta(hours=24) + timedelta(hours=48)}


def test_lockout_expired_after_48_hours():
    sets = [make_set("chest", 0, "s1", 49), make_set("chest", 0, "s1", 49)]
    assert muscles_in_recovery(sets, NOW) == {}


def test_lockout_ending_exactly_now_counts_as_recovered():
    sets = [make_set("chest", 0, "s1", 48), make_set("chest", 0, "s1", 48)]
    assert muscles_in_recovery(sets, NOW) == {}


def test_one_failure_does_not_trigger():
    sets = [make_set("chest", 0, "s1", 24), make_set("chest", 2, "s1", 24)]
    assert muscles_in_recovery(sets, NOW) == {}


def test_only_triggering_muscle_is_returned():
    sets = [
        make_set("chest", 0, "s1", 24),
        make_set("chest", 0, "s1", 24),
        make_set("back", 0, "s1", 24),
        make_set("back", 3, "s1", 24),
    ]
    assert list(muscles_in_recovery(sets, NOW)) == ["chest"]


def test_failures_split_across_sessions_do_not_trigger():
    sets = [make_set("chest", 0, "s1", 24), make_set("chest", 0, "s2", 20)]
    assert muscles_in_recovery(sets, NOW) == {}


def test_empty_input_returns_empty_dict():
    assert muscles_in_recovery([], NOW) == {}


def test_latest_lockout_wins_across_sessions():
    sets = [
        make_set("chest", 0, "s1", 40),
        make_set("chest", 0, "s1", 40),
        make_set("chest", 0, "s2", 10),
        make_set("chest", 0, "s2", 10),
    ]
    result = muscles_in_recovery(sets, NOW)
    assert result["chest"] == NOW - timedelta(hours=10) + timedelta(hours=48)


def test_lockout_starts_at_last_failure_set():
    sets = [make_set("chest", 0, "s1", 30), make_set("chest", 0, "s1", 20)]
    result = muscles_in_recovery(sets, NOW)
    assert result["chest"] == NOW - timedelta(hours=20) + timedelta(hours=48)