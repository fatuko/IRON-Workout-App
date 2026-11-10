"""
Recovery rule for IRON.

muscles_in_recovery() flags muscle groups that should not be trained
again yet because they were taken to failure repeatedly in one session.

Rule (see docs/research.md "Rules summary"):
    - A "failure set" is a set with rir <= FAILURE_RIR_THRESHOLD.
    - If a muscle group has FAILURE_SETS_TO_TRIGGER_RECOVERY_RULE or more
      failure sets in a single session, it is locked out for
      FAILURE_RECOVERY_HOURS.
    - Basis: moran_navarro2017, pareja_blanco2020, belcher2019.

Judgment call (not a research finding): only each set's PRIMARY muscle
group is counted. Failure on a compound lift therefore under-counts
fatigue in secondary muscles. Recovery is modeled per muscle group, per
belcher2019.
"""

from collections import defaultdict
from datetime import datetime, timedelta

from app.services.constants import (
    FAILURE_RIR_THRESHOLD,
    FAILURE_SETS_TO_TRIGGER_RECOVERY_RULE,
    FAILURE_RECOVERY_HOURS,
)


def muscles_in_recovery(
    recent_sets: list[dict],
    now: datetime,
) -> dict[str, datetime]:
    """
    Return the muscle groups that are still locked out for recovery.

    Args:
        recent_sets: each dict has "muscle_group" (primary muscle),
            "rir", "session_id", and "performed_at" (timezone-aware
            datetime).
        now: the current time (timezone-aware), passed in so the
            function stays pure and testable.

    Returns:
        {muscle_group: locked_until}. The lockout starts at the
        performed_at of the last failure set in a triggering session and
        lasts FAILURE_RECOVERY_HOURS. If a muscle triggered in more than
        one session, the latest lockout is kept. Only muscle groups with
        locked_until > now are included, so a lockout that ends exactly
        at `now` counts as recovered.
    """
    failures_by_session = defaultdict(list)
    for s in recent_sets:
        if s["rir"] <= FAILURE_RIR_THRESHOLD:
            key = (s["muscle_group"], s["session_id"])
            failures_by_session[key].append(s["performed_at"])

    locked_until = {}
    for (muscle, _session), times in failures_by_session.items():
        if len(times) < FAILURE_SETS_TO_TRIGGER_RECOVERY_RULE:
            continue
        end = max(times) + timedelta(hours=FAILURE_RECOVERY_HOURS)
        if muscle not in locked_until or end > locked_until[muscle]:
            locked_until[muscle] = end

    return {m: t for m, t in locked_until.items() if t > now}