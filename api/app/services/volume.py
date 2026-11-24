from collections import defaultdict
from datetime import datetime, timedelta

from app.services.constants import (
    INDIRECT_SET_WEIGHT,
    HYPERTROPHY_VOLUME_ANCHOR_SETS_PER_WEEK,
    STRENGTH_VOLUME_ANCHOR_SETS_PER_WEEK,
)

def weekly_volume(sets: list[dict], now: datetime) -> dict[str, float]:
    cutoff = now - timedelta(days=7)
    totals = defaultdict(float)
    for s in sets:
        if s["performed_at"] <= cutoff:
            continue
        totals[s["primary_muscle"]] += 1.0
        for muscle in s["secondary_muscles"]:
            totals[muscle] += INDIRECT_SET_WEIGHT
    return dict(totals)
def muscles_below_anchor(volumes: dict[str, float], muscles: list[str], goal: str) -> dict[str, float]:
    if goal == "hypertrophy":
        anchor = HYPERTROPHY_VOLUME_ANCHOR_SETS_PER_WEEK
    elif goal == "strength":
        anchor = STRENGTH_VOLUME_ANCHOR_SETS_PER_WEEK
    elif goal == "general":
        return {}
    else:
        raise ValueError(f"Unknown goal: {goal}")

    below_anchor = {}
    for muscle in muscles:
        if volumes.get(muscle, 0.0) < anchor:
            below_anchor[muscle] = anchor - volumes.get(muscle, 0.0)
    return below_anchor