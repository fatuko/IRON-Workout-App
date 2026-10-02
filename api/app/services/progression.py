"""
Progression suggestion engine for IRON.

suggest_next() takes an exercise's recent set history and returns a
suggested weight/reps for the next session, staying inside the
user's own rep range and weighted by their training goal and
experience level.

Decision logic (see docs/research.md "Rules summary" for citations):
    1. Estimate 1RM for each recent set; use the highest as the
       current working estimate of capability.
    2. Average RIR over the last RIR_TREND_WINDOW_SESSIONS sets, not
       a single session -- robinson2024's own caveat is that RIR is
       an estimate, so the engine shouldn't overreact to one unusual
       session.
    3. Determine the target RIR window: NOVICE_RIR_TARGET overrides
       RIR_TARGET[goal] when training_experience == "novice".
    4. If avg RIR is above the target window (recent sets felt too
       easy):
        - strength goal -> suggest more weight
        - hypertrophy goal -> suggest more reps first, if there's
          room in the exercise's rep range; otherwise more weight
    5. If avg RIR is below the target window (felt too hard): hold
       the most recent weight/reps rather than suggesting a change.
    6. Never suggest reps outside [rep_range_min, rep_range_max].
       This is a hard constraint, not a tunable constant.
    7. Return the suggestion with a plain-language reason and the
       citation keys of every rule that fired.
"""

from app.services.one_rm import estimate_1rm
from app.services.constants import (
    RIR_TARGET,
    NOVICE_RIR_TARGET,
    RIR_TREND_WINDOW_SESSIONS,
    LOAD_INCREMENT_PCT,
)


def suggest_next(
    exercise: dict,
    recent_sets: list[dict],
    goal: str,
    training_experience: str,
) -> dict:
    """
    Suggest the next session's weight and reps for an exercise.

    Args:
        exercise: dict with "rep_range_min", "rep_range_max".
        recent_sets: list of dicts, most recent last, each with
            "weight_kg", "reps", "rir". Expected to span the last
            several sessions on this exercise.
        goal: one of "hypertrophy", "strength", "general".
        training_experience: one of "novice", "intermediate", "advanced".

    Returns:
        {
            "suggested_weight_kg": float,
            "suggested_reps": int,
            "reason": str,
            "basis": list[str],
        }
    """
    if not recent_sets:
        raise ValueError("recent_sets cannot be empty")

    window = recent_sets[-RIR_TREND_WINDOW_SESSIONS:]

   
    estimates = [
        estimate_1rm(s["weight_kg"], s["reps"], s["rir"])
        for s in window
    ]
    best = max(estimates, key=lambda e: e["estimated_1rm"])


    avg_rir = sum(s["rir"] for s in window) / len(window)


    if training_experience == "novice":
        target_min, target_max = NOVICE_RIR_TARGET
        target_basis = ["robinson2024", "moran_navarro2017", "pareja_blanco2020"]
    else:
        target_min, target_max = RIR_TARGET[goal]
        target_basis = ["robinson2024"]

    last_set = recent_sets[-1]
    suggested_weight_kg = last_set["weight_kg"]
    suggested_reps = last_set["reps"]
    basis = list(target_basis)

    if avg_rir > target_max:

        if goal == "strength":
            increment = LOAD_INCREMENT_PCT[training_experience]
            suggested_weight_kg = round(last_set["weight_kg"] * (1 + increment), 1)
            reason = (
                f"Recent sets averaged {avg_rir:.1f} RIR, above your "
                f"{goal} target of {target_min}-{target_max}. Adding weight."
            )
            basis.append("currier2023")
        else:
         
            if suggested_reps < exercise["rep_range_max"]:
                suggested_reps += 1
                reason = (
                    f"Recent sets averaged {avg_rir:.1f} RIR, above your "
                    f"{goal} target of {target_min}-{target_max}. Adding a rep."
                )
            else:
                increment = LOAD_INCREMENT_PCT[training_experience]
                suggested_weight_kg = round(last_set["weight_kg"] * (1 + increment), 1)
                suggested_reps = exercise["rep_range_min"]
                reason = (
                    f"Recent sets averaged {avg_rir:.1f} RIR and you're at the "
                    f"top of your rep range. Adding weight, resetting reps."
                )
            basis.append("schoenfeld2021")
    elif avg_rir < target_min:
   
        reason = (
            f"Recent sets averaged {avg_rir:.1f} RIR, below your "
            f"{goal} target of {target_min}-{target_max}. Holding steady."
        )
    else:
        reason = (
            f"Recent sets averaged {avg_rir:.1f} RIR, inside your "
            f"{goal} target of {target_min}-{target_max}. Holding steady."
        )


    suggested_reps = max(
        exercise["rep_range_min"],
        min(suggested_reps, exercise["rep_range_max"]),
    )

    return {
        "suggested_weight_kg": suggested_weight_kg,
        "suggested_reps": suggested_reps,
        "reason": reason,
        "basis": basis,
        "current_estimated_1rm": best["estimated_1rm"],
        "estimate_low_confidence": best["low_confidence"],
    }