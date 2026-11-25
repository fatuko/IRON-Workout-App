from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
AUTH = {"Authorization": "Bearer test"}


def iso(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def body(**overrides):
    base = {
        "goal": "hypertrophy",
        "recent_sets": [],
        "planned_split": [],
        "muscles": ["chest", "back"],
    }
    base.update(overrides)
    return base


def make_set(muscle="chest", rir=0, minutes_ago=60, session="s1", secondary=None):
    performed = datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)
    return {
        "primary_muscle": muscle,
        "secondary_muscles": secondary or [],
        "rir": rir,
        "session_id": session,
        "performed_at": iso(performed),
    }


def test_missing_token_returns_401():
    r = client.post("/workout/check", json=body())
    assert r.status_code == 401


def test_response_always_has_all_three_fields():
    r = client.post("/workout/check", json=body(), headers=AUTH)
    assert r.status_code == 200
    assert set(r.json()) == {"recovery_lockouts", "low_volume", "frequency_warnings"}


def test_empty_input_flags_low_volume_and_frequency():
    r = client.post("/workout/check", json=body(), headers=AUTH)
    data = r.json()
    assert data["recovery_lockouts"] == {}
    assert data["low_volume"] == {"chest": 10.5, "back": 10.5}
    assert data["frequency_warnings"] == {"chest": 0, "back": 0}


def test_two_failure_sets_in_one_session_lock_the_muscle():
    sets = [make_set(minutes_ago=90), make_set(minutes_ago=60)]
    r = client.post("/workout/check", json=body(recent_sets=sets), headers=AUTH)
    lockouts = r.json()["recovery_lockouts"]
    assert "chest" in lockouts
    assert lockouts["chest"].endswith("Z")


def test_one_failure_set_does_not_lock():
    r = client.post(
        "/workout/check", json=body(recent_sets=[make_set()]), headers=AUTH
    )
    assert r.json()["recovery_lockouts"] == {}


def test_general_goal_never_reports_low_volume():
    r = client.post("/workout/check", json=body(goal="general"), headers=AUTH)
    assert r.json()["low_volume"] == {}


def test_secondary_muscles_count_half_toward_volume():
    sets = [make_set(muscle="back", rir=2, secondary=["chest"])]
    r = client.post("/workout/check", json=body(recent_sets=sets), headers=AUTH)
    low = r.json()["low_volume"]
    assert low["back"] == 9.5
    assert low["chest"] == 10.0


def test_split_with_two_days_clears_frequency_warning():
    split = [["chest"], ["chest", "back"]]
    r = client.post("/workout/check", json=body(planned_split=split), headers=AUTH)
    assert r.json()["frequency_warnings"] == {"back": 1}


def test_naive_timestamp_returns_422():
    bad = make_set()
    bad["performed_at"] = "2026-11-09T18:00:00"
    r = client.post("/workout/check", json=body(recent_sets=[bad]), headers=AUTH)
    assert r.status_code == 422


def test_rir_out_of_range_returns_422():
    bad = make_set(rir=6)
    r = client.post("/workout/check", json=body(recent_sets=[bad]), headers=AUTH)
    assert r.status_code == 422


def test_unknown_goal_returns_422():
    r = client.post("/workout/check", json=body(goal="cardio"), headers=AUTH)
    assert r.status_code == 422