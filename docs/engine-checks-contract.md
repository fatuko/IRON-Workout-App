# Engine Checks Endpoint Contract

Status: **proposed**, pending sign-off from the team.
Owner: Olakiite. Exposes `muscles_in_recovery()`, `weekly_volume()` / `muscles_below_anchor()`, and `muscles_below_min_frequency()` from `api/app/services/`.

This is the contract the route will be built to. The client can build the workout-screen warnings against the examples below before the route exists. If the contract needs to change, change this doc first, then the code.

## Endpoint

```
POST /workout/check
Authorization: Bearer <Supabase access token>
Content-Type: application/json
```

One call runs all three checks (recovery, weekly volume, frequency) and returns every flag together.

## Design decisions

- **Stateless in v1.** The client sends the recent sets and the planned split in the request body, and the API does no database reads. This matches `POST /progression/suggest`.
- **Server time.** The API uses its own current UTC time as "now". The client does not send it.
- **Reports only.** The endpoint returns flags and the data behind them. It never changes or blocks the user's plan. What the UI does with a flag (warning, swap, or a higher RIR target) is a separate decision.
- **Primary muscle drives recovery and frequency.** Secondary muscles only count toward volume, at half credit.
- **All timestamps are ISO 8601 with a timezone** (UTC `Z` recommended). A timestamp without a timezone is rejected.

## Request

```json
{
  "goal": "hypertrophy",
  "recent_sets": [
    {
      "primary_muscle": "chest",
      "secondary_muscles": ["triceps", "shoulders"],
      "rir": 0,
      "session_id": "abc123",
      "performed_at": "2026-11-09T18:00:00Z"
    }
  ],
  "planned_split": [
    ["chest", "triceps"],
    ["back", "biceps"],
    ["legs"]
  ],
  "muscles": ["chest", "back", "legs", "shoulders", "biceps", "triceps"]
}
```

| Field | Type | Rules |
|---|---|---|
| `goal` | string | `"hypertrophy"`, `"strength"`, or `"general"` |
| `recent_sets` | array | May be empty. Send at least the last 7 days of sets. |
| `recent_sets[].primary_muscle` | string | One of the allowed muscle names (see below) |
| `recent_sets[].secondary_muscles` | string[] | May be empty. Allowed muscle names only. |
| `recent_sets[].rir` | int | 0 to 5 |
| `recent_sets[].session_id` | string | Sets with the same value belong to one session |
| `recent_sets[].performed_at` | string | ISO 8601 with timezone |
| `planned_split` | array | One entry per training day. Each entry is a list of primary muscle names. May be empty. |
| `muscles` | string[] | Every muscle to check. A muscle missing from the split and from `recent_sets` is still checked. |

**Allowed muscle names:** lowercase, matching the `movements` table. *(Open: final list to be copied from the schema before sign-off.)*

## Response (200)

```json
{
  "recovery_lockouts": {
    "chest": "2026-11-11T18:00:00Z"
  },
  "low_volume": {
    "back": 4.5
  },
  "frequency_warnings": {
    "legs": 1
  }
}
```

| Field | Type | Meaning |
|---|---|---|
| `recovery_lockouts` | object | `{muscle: locked_until}`. The muscle had 2 or more failure sets (RIR 0) in one session and is locked out for 48 hours from the last failure set. Only lockouts still active are listed. |
| `low_volume` | object | `{muscle: shortfall}` in fractional sets per week, for muscles under the goal's anchor (10.5 for hypertrophy, 6 for strength). Always empty for the `general` goal. |
| `frequency_warnings` | object | `{muscle: days_per_week}` for muscles in `muscles` trained on fewer than 2 days of `planned_split`. |

An empty object means no flags of that kind. The response always includes all three fields.

### Guarantees the client can rely on

- All three fields are always present.
- `recovery_lockouts` values are ISO 8601 UTC timestamps.
- `low_volume` values are positive numbers.
- `frequency_warnings` values are whole numbers below 2.

## Errors

| Status | When | Body |
|---|---|---|
| 401 | Missing or invalid token | `{"detail": "..."}` |
| 422 | Request fails validation: unknown `goal`, `rir` outside 0 to 5, a muscle name not in the allowed list, a `performed_at` without a timezone, or a missing required field | FastAPI's standard validation error body |
| 500 | Unexpected engine error | `{"detail": "..."}` |

The client should treat any non-200 as "no checks available" and show no warnings.

## Known limitations (v1)

- Recovery counts only each set's primary muscle, so failure on a compound lift under-counts fatigue in secondary muscles.
- Volume uses a rolling 7-day window ending now, not a calendar week.
- The `general` goal has no volume anchor, so it never reports low volume.
- The frequency check applies to every goal, and it reads the planned split, not logged history.
- The anchors (10.5 and 6 sets per week) are reference points from the research, not hard targets, and nothing here flags too much volume.

## Open questions

- **Everyone:** the final list of allowed muscle names, copied from the `movements` table.
- **Client:** is sending the last 7 days of sets practical, or should the API fetch them later by user ID? (A later version may read sets with the user's token so RLS applies.)
- **Everyone:** what the UI does with a recovery lockout. This endpoint only reports it.
- **Auth owner:** the token check is still a stub. Real verification must land before this endpoint is deployed.