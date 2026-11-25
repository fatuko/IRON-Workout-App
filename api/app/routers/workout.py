"""POST /workout/check -- runs the recovery, volume and frequency rules."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.routers.progression import require_user
from app.schemas.check import CheckRequest, CheckResponse
from app.services.frequency import muscles_below_min_frequency
from app.services.recovery import muscles_in_recovery
from app.services.volume import muscles_below_anchor, weekly_volume

router = APIRouter(prefix="/workout", tags=["workout"])


@router.post("/check", response_model=CheckResponse)
def check(req: CheckRequest, _user: str = Depends(require_user)):
    now = datetime.now(timezone.utc)  # server time, per the contract

    sets = [s.model_dump() for s in req.recent_sets]

    # muscles_in_recovery reads "muscle_group"; weekly_volume reads
    # "primary_muscle". Map once here so the services stay untouched.
    recovery_input = [{**s, "muscle_group": s["primary_muscle"]} for s in sets]

    lockouts = muscles_in_recovery(recovery_input, now)
    volumes = weekly_volume(sets, now)

    return {
        "recovery_lockouts": {
            m: t.astimezone(timezone.utc) for m, t in lockouts.items()
        },
        "low_volume": muscles_below_anchor(volumes, req.muscles, req.goal),
        "frequency_warnings": muscles_below_min_frequency(
            req.planned_split, req.muscles
        ),
    }