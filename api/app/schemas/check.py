"""
Request/response models for POST /workout/check.

These mirror docs/engine-checks-contract.md. If the contract changes,
change that doc first, then this file.
"""

from datetime import datetime

from pydantic import AwareDatetime, BaseModel, Field

from app.schemas.progression import Goal

# TODO: replace plain str with the allowed muscle names once the list is
# copied from the movements table (open question in the contract).


class CheckSetIn(BaseModel):
    primary_muscle: str
    secondary_muscles: list[str] = Field(default_factory=list)
    rir: int = Field(ge=0, le=5)
    session_id: str
    performed_at: AwareDatetime  # rejects timestamps with no timezone


class CheckRequest(BaseModel):
    goal: Goal
    recent_sets: list[CheckSetIn]
    planned_split: list[list[str]]
    muscles: list[str]


class CheckResponse(BaseModel):
    recovery_lockouts: dict[str, datetime]
    low_volume: dict[str, float]
    frequency_warnings: dict[str, int]