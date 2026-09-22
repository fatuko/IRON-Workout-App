"""
Progression engine constants for IRON.

Every constant here traces to an entry in docs/research.md and
api/app/data/citations.json via its `basis` key(s). If you change a
number here, update the matching entry in research.md's "Rules summary"
table so the two never drift apart.

Do not hardcode these values anywhere else in the codebase. Import
from this module so there is exactly one place to update when a
citation is superseded or a full text read narrows an estimate.
"""

# ---------------------------------------------------------------------------
# Volume: fractional set counting
# basis: pelland2026
# ---------------------------------------------------------------------------

# A set counts fully for the primary mover and at this fraction for
# each secondary muscle listed on the movement.
INDIRECT_SET_WEIGHT = 0.5

# Rough weekly anchors from pelland2026's included studies. These are
# reference points for flagging "low volume," not hard caps.
HYPERTROPHY_VOLUME_ANCHOR_SETS_PER_WEEK = 10.5
STRENGTH_VOLUME_ANCHOR_SETS_PER_WEEK = 6


STRENGTH_VOLUME_PLATEAU_SETS_PER_WEEK = 4

# TODO: remmert2025 full text has the per-session set cap
# ("point of undetectable outcome superiority"). Placeholder until read.
MAX_SETS_PER_MUSCLE_PER_SESSION = None  # basis: remmert2025 (unread)


# ---------------------------------------------------------------------------
# Frequency
# basis: schoenfeld2016
# ---------------------------------------------------------------------------

MIN_FREQUENCY_PER_MUSCLE_PER_WEEK = 2


# ---------------------------------------------------------------------------
# Proximity to failure (RIR) targets, by goal and experience
# basis: robinson2024 (goal split); novice adjustment is a project
# judgment call, not a finding — see research.md "Note on judgment calls"
# ---------------------------------------------------------------------------

# (min_rir, max_rir) — the engine nudges recent-average RIR toward
# this window. Values are inclusive.
RIR_TARGET = {
    "hypertrophy": (0, 2),
    "strength": (1, 4),
    "general": (1, 3),  # judgment call: midpoint, no direct evidence
}

# Novice lifters get a shifted, narrower window regardless of goal.
# Rationale: RIR estimation is least reliable in untrained lifters,
# and failure training carries the highest injury/recovery cost for
# people with the least developed technique. This overrides
# RIR_TARGET for training_experience == "novice".
# basis: project judgment call, informed by robinson2024's caveat on
# RIR estimation reliability and moran_navarro2017 / pareja_blanco2020
# on the cost of failure training. Not a direct finding.
NOVICE_RIR_TARGET = (2, 3)

# How many recent sessions to average RIR over before the engine
# reacts. Guards against overreacting to one unusual session, per
# robinson2024's own caveat that RIR is an estimate, not a measurement.
RIR_TREND_WINDOW_SESSIONS = 3


# ---------------------------------------------------------------------------
# Load vs. reps: which lever the engine pulls, by goal
# basis: currier2023, schoenfeld2021
# ---------------------------------------------------------------------------

# Strength goal: bias toward this fraction of estimated 1RM.
STRENGTH_LOAD_FLOOR_PCT_1RM = 0.80

# Load increment size, as a fraction of current working weight.
# Smaller for novices per the conservative-defaults decision.
LOAD_INCREMENT_PCT = {
    "novice": 0.025,
    "intermediate": 0.05,
    "advanced": 0.05,
}


# ---------------------------------------------------------------------------
# Recovery
# basis: moran_navarro2017, pareja_blanco2020, belcher2019
# ---------------------------------------------------------------------------

# Sets at or below this RIR count as "failure sets" for recovery purposes.
FAILURE_RIR_THRESHOLD = 0

# Number of failure sets in one session, for one muscle group, that
# triggers the extended recovery rule.
FAILURE_SETS_TO_TRIGGER_RECOVERY_RULE = 2

# Hours required before that muscle group can appear again in the
# split rotation once triggered.
FAILURE_RECOVERY_HOURS = 48

# Recovery is modeled per muscle group, not per exercise or per lift.
# basis: belcher2019 (squat/bench/deadlift recover on similar timelines)
RECOVERY_GRANULARITY = "muscle_group"


# ---------------------------------------------------------------------------
# 1RM estimation
# basis: marzagao2026 (formula), reynolds2006 (rep ceiling)
# ---------------------------------------------------------------------------

# Below this bar weight in kilograms, the Marzagao formula's
# denominator can go non-positive. Guard and skip estimation.
ONE_RM_MIN_WEIGHT_KG = 1.8

# Above this rep count, treat estimated_1rm as low-confidence and
# flag it in trend views rather than presenting it as the user's max.
# basis: reynolds2006 found 5RM tests far more accurate than 10RM/20RM
# (R^2 0.993 vs. substantially lower at higher reps). 12 is a rounded
# cutoff pending the exact R^2-by-rep-range breakdown from the full text.
ONE_RM_MAX_RELIABLE_REPS = 12

# A single fixed conversion factor does not generalize across
# exercises (lesuer1997, meneses2013), which is why marzagao2026's
# weight-dependent formula is used instead of a classical one.
# No numeric constant here; this is documentation for why the
# formula in one_rm.py is not a classical Epley/Brzycki/etc.


# ---------------------------------------------------------------------------
# Rep ranges: hard constraint, never overridden by the engine
# basis: project design principle, see research.md intro and
# schoenfeld2021 / currier2023 on load-independence of hypertrophy
# ---------------------------------------------------------------------------

# The engine must never suggest reps outside [rep_range_min, rep_range_max]
# as stored on the exercise. There is no constant here by design --
# this is a hard constraint enforced in progression.py, not a tunable
# value, and it should never be made configurable away from "respect
# the user's range."