"""
Tests for one_rm.py — the weight-dependent 1RM formula from marzagao2026.
"""

import pytest

from app.services.one_rm import estimate_1rm
from app.services.constants import ONE_RM_MIN_WEIGHT_KG, ONE_RM_MAX_RELIABLE_REPS


def test_known_value():
    result = estimate_1rm(weight_kg=100, reps=5, rir=0)
    assert result["estimated_1rm"] == pytest.approx(117.52, rel=1e-3)
    assert result["low_confidence"] is False



def test_rir_changes_estimate():
    no_rir = estimate_1rm(weight_kg=100, reps=5, rir=0)
    with_rir = estimate_1rm(weight_kg=100, reps=5, rir=2)
    assert no_rir["estimated_1rm"] != with_rir["estimated_1rm"]
    assert with_rir["estimated_1rm"] > no_rir["estimated_1rm"]


def test_low_confidence_flag_at_boundary():
    at_ceiling = estimate_1rm(weight_kg=50, reps=ONE_RM_MAX_RELIABLE_REPS, rir=0)
    over_ceiling = estimate_1rm(weight_kg=50, reps=ONE_RM_MAX_RELIABLE_REPS + 1, rir=0)
    assert at_ceiling["low_confidence"] is False
    assert over_ceiling["low_confidence"] is True


def test_raises_below_min_weight():
    with pytest.raises(ValueError):
        estimate_1rm(weight_kg=ONE_RM_MIN_WEIGHT_KG - 0.1, reps=5, rir=0)