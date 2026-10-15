"""
Request/response models for POST /progression/suggest.

These mirror docs/progression-endpoint-contract.md. If the contract
changes, change that doc first, then this file.
"""

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.services.constants import ONE_RM_MIN_WEIGHT_KG

Goal = Literal["hypertrophy", "strength", "general"]
Experience = Literal["novice", "intermediate", "advanced"]


class ExerciseIn(BaseModel):
    rep_range_min: int = Field(ge=1)
    rep_range_max: int = Field(ge=1)

    @model_validator(mode="after")
    def max_not_below_min(self):
        if self.rep_range_max < self.rep_range_min:
            raise ValueError("rep_range_max must be >= rep_range_min")
        return self


class SetIn(BaseModel):
    weight_kg: float = Field(ge=ONE_RM_MIN_WEIGHT_KG)
    reps: int = Field(ge=1)
    rir: int = Field(ge=0, le=5)


class SuggestRequest(BaseModel):
    exercise: ExerciseIn
    # Oldest -> newest. The engine reads the end of the list.
    recent_sets: list[SetIn] = Field(min_length=1)
    goal: Goal
    training_experience: Experience


class SuggestResponse(BaseModel):
    suggested_weight_kg: float
    suggested_reps: int
    reason: str
    basis: list[str] = Field(min_length=1)
    current_estimated_1rm: float
    estimate_low_confidence: bool
    below_strength_load_floor: bool
