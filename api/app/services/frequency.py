"""
Frequency warning for IRON.

muscles_below_min_frequency() checks a planned weekly split and flags
muscle groups that are trained fewer than MIN_FREQUENCY_PER_MUSCLE_PER_WEEK
times per week.

Rule (see docs/research.md "Rules summary"):
    - When a user builds a split, warn if any muscle group is trained
      fewer than 2 times per week.
    - Basis: schoenfeld2016. pelland2026 also finds frequency matters
      for strength.

Judgment calls (not research findings):
    - A muscle counts as trained on a day only if it is the primary
      muscle of at least one planned exercise that day. Secondary-only
      work does not count, matching the recovery rule.
    - The warning applies to every goal. schoenfeld2019 finds frequency
      has no independent effect on hypertrophy once volume is equated,
      so this is a conservative default, not a requirement.
"""

from app.services.constants import MIN_FREQUENCY_PER_MUSCLE_PER_WEEK


def muscles_below_min_frequency(
    split: list[list[str]],
    muscles: list[str],
) -> dict[str, int]:

    days_trained = {muscle: 0 for muscle in muscles}
    for day in split:
        for muscle in set(day):
            if muscle in days_trained:
                days_trained[muscle] += 1

    return {
        muscle: count
        for muscle, count in days_trained.items()
        if count < MIN_FREQUENCY_PER_MUSCLE_PER_WEEK
    }