from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
AUTH = {"Authorization": "Bearer test-token"}


def body(**over):
    b = {
        "exercise": {"rep_range_min": 8, "rep_range_max": 12},
        "recent_sets": [{"weight_kg": 60.0, "reps": 8, "rir": 4}] * 3,
        "goal": "hypertrophy",
        "training_experience": "intermediate",
    }
    b.update(over)
    return b


def test_contract_hypertrophy_example():
    r = client.post("/progression/suggest", json=body(), headers=AUTH)
    assert r.status_code == 200
    d = r.json()
    assert d["suggested_weight_kg"] == 60.0
    assert d["suggested_reps"] == 9
    assert d["current_estimated_1rm"] == 88.4
    assert d["basis"] == ["robinson2024", "schoenfeld2021"]
    assert set(d) == {
        "suggested_weight_kg", "suggested_reps", "reason", "basis",
        "current_estimated_1rm", "estimate_low_confidence",
        "below_strength_load_floor",
    }


def test_contract_strength_example_sets_floor_flag():
    r = client.post(
        "/progression/suggest",
        json=body(
            exercise={"rep_range_min": 3, "rep_range_max": 6},
            recent_sets=[{"weight_kg": 100.0, "reps": 5, "rir": 5}] * 3,
            goal="strength",
        ),
        headers=AUTH,
    )
    d = r.json()
    assert d["suggested_weight_kg"] == 105.0
    assert d["suggested_reps"] == 5
    assert d["current_estimated_1rm"] == 134.9
    assert d["below_strength_load_floor"] is True


def test_missing_token_is_401():
    assert client.post("/progression/suggest", json=body()).status_code == 401


def test_empty_bearer_is_401():
    r = client.post("/progression/suggest", json=body(), headers={"Authorization": "Bearer "})
    assert r.status_code == 401


def test_validation_errors_are_422():
    bad = [
        body(recent_sets=[]),
        body(recent_sets=[{"weight_kg": 1.0, "reps": 5, "rir": 2}]),
        body(recent_sets=[{"weight_kg": 60, "reps": 5, "rir": 6}]),
        body(recent_sets=[{"weight_kg": 60, "reps": 0, "rir": 2}]),
        body(goal="bulk"),
        body(training_experience="expert"),
        body(exercise={"rep_range_min": 12, "rep_range_max": 8}),
    ]
    for b in bad:
        r = client.post("/progression/suggest", json=b, headers=AUTH)
        assert r.status_code == 422, b


def test_reps_always_in_range():
    r = client.post(
        "/progression/suggest",
        json=body(recent_sets=[{"weight_kg": 60, "reps": 20, "rir": 4}] * 3),
        headers=AUTH,
    )
    d = r.json()
    assert 8 <= d["suggested_reps"] <= 12


def test_health():
    assert client.get("/health").json() == {"status": "ok"}
