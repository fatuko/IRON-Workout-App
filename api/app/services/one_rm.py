"""
1RM estimation for IRON.

Implements the weight-dependent 1RM formula from marzagao2026 (see
docs/research.md), rather than a classical fixed-factor equation
(Epley, Brzycki, etc.), because equation validity has been shown to
be exercise-dependent (lesuer1997, meneses2013).

Formula:
    1RM = w * (1 + (r - 1)^0.85 / (-2.55 + 4.58 * ln(w)))

where w is weight in KILOGRAMS and r is the effective rep count.
The formula was fit on near-failure sets, so r should be reps + rir,
not raw reps -- see marzagao2026's caveat in docs/research.md.
"""

import math

from app.services.constants import (
    ONE_RM_MIN_WEIGHT_KG,
    ONE_RM_MAX_RELIABLE_REPS,
)


def estimate_1rm(weight_kg: float, reps: int, rir: int = 0) -> dict:
    """
    Estimate one-rep max from a logged set.

    Args:
        weight_kg: load used, in kilograms.
        reps: reps actually completed.
        rir: reps in reserve reported by the user (0-5). Added to
            reps to get the effective rep count, since the formula
            was fit on near-failure sets.

    Returns:
        {
            "estimated_1rm": float,
            "low_confidence": bool,  # True if reps > ONE_RM_MAX_RELIABLE_REPS
        }

    Raises:
        ValueError: if weight_kg is below ONE_RM_MIN_WEIGHT_KG, where
            the formula's denominator can go non-positive.
    """
    if weight_kg < ONE_RM_MIN_WEIGHT_KG:
        raise ValueError(
        f"weight_kg must be at least {ONE_RM_MIN_WEIGHT_KG} kg, "
        f"got {weight_kg}. The 1RM formula's denominator becomes "
        f"non-positive below this threshold."
        )
    effective_reps = reps + rir
    numerator = (effective_reps - 1) ** 0.85
    denominator = -2.55 + 4.58 * math.log(weight_kg)
    estimated_1rm = weight_kg * (1 + numerator / denominator)
    low_confidence = reps > ONE_RM_MAX_RELIABLE_REPS
    return {
        "estimated_1rm": estimated_1rm,
        "low_confidence": low_confidence
    }