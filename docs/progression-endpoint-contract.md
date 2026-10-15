# Progression Endpoint Contract

Status: **proposed**, pending sign-off from Aliyah (client) and Nathaniel (auth/infra).
Owner: Olakiite. Implements `suggest_next()` in `api/app/services/progression.py`.

This is the contract the route will be built to. Aliyah can build the suggestion UI and the "Why?" panel against the mock examples below before the route exists. If the contract needs to change, change this doc first, then the code.

## Endpoint

```
POST /progression/suggest
Authorization: Bearer <Supabase access token>
Content-Type: application/json
```

One call returns one suggestion for one exercise. To pre-fill a whole workout, the client makes one call per exercise.

## Design decisions

- **Stateless in v1.** The client sends the recent sets in the request body and the API does no database reads. This keeps the route a thin wrapper around a pure function and lets the endpoint work before the Supabase schema is live. A later version may accept `exercise_id` and have the API fetch sets using the user's token, so RLS applies.
- **Kilograms only.** Every weight in a request or response is in kg. The client converts to and from the user's display unit. The API never sees lbs.
- **The engine never changes the user's rep range.** Suggested reps are always within `rep_range_min` and `rep_range_max`.

## Request

```json
{
  "exercise": {
    "rep_range_min": 8,
    "rep_range_max": 12
  },
  "recent_sets": [
    { "weight_kg": 60.0, "reps": 8, "rir": 4 },
    { "weight_kg": 60.0, "reps": 8, "rir": 4 },
    { "weight_kg": 60.0, "reps": 8, "rir": 4 }
  ],
  "goal": "hypertrophy",
  "training_experience": "intermediate"
}
```

| Field | Type | Rules |
|---|---|---|
| `exercise.rep_range_min` | int | >= 1 |
| `exercise.rep_range_max` | int | >= `rep_range_min` |
| `recent_sets` | array | At least 1 item. **Ordered oldest to newest, most recent last.** Send the last 3 to 10 sets for this exercise on this machine. The engine reads the end of the list. |
| `recent_sets[].weight_kg` | number | >= 1.8. Below that, the 1RM formula breaks down. |
| `recent_sets[].reps` | int | >= 1 |
| `recent_sets[].rir` | int | 0 to 5 (5 means five or more) |
| `goal` | string | `"hypertrophy"`, `"strength"`, or `"general"` |
| `training_experience` | string | `"novice"`, `"intermediate"`, or `"advanced"` |

## Response (200)

```json
{
  "suggested_weight_kg": 60.0,
  "suggested_reps": 9,
  "reason": "Recent sets averaged 4.0 RIR, above your hypertrophy target of 0-2. Adding a rep.",
  "basis": ["robinson2024", "schoenfeld2021"],
  "current_estimated_1rm": 88.4,
  "estimate_low_confidence": false,
  "below_strength_load_floor": false
}
```

(`current_estimated_1rm` is illustrative, rounded from the formula.)

| Field | Type | Meaning |
|---|---|---|
| `suggested_weight_kg` | number | Suggested working weight in kg. Display-round it to a loadable increment in the client; never round the stored value. |
| `suggested_reps` | int | Always within the exercise's rep range. |
| `reason` | string | Plain-language explanation, ready to show in the UI as written. |
| `basis` | string[] | Citation keys for every rule that fired. Never empty. Keys match `api/app/data/citations.json`. |
| `current_estimated_1rm` | number | Best estimated 1RM across the recent window, in kg. |
| `estimate_low_confidence` | bool | True when the best-estimate set had more than 12 reps. Don't present the 1RM as the user's max. |
| `below_strength_load_floor` | bool | Only ever true for the strength goal. The suggested weight is under 80% of estimated 1RM. **Advisory only:** the engine did not change the plan. The UI may show a hint that heavier loads tend to help strength. |

### Guarantees the client can rely on

- `suggested_reps` is always inside the rep range.
- `basis` always has at least one key.
- All weights are kg.
- The response always includes all seven fields.

### Example: strength goal with the floor flag

Request: 100 kg x 5 at 5 RIR, three sets, rep range 3 to 6, goal `strength`, `intermediate`.

```json
{
  "suggested_weight_kg": 105.0,
  "suggested_reps": 5,
  "reason": "Recent sets averaged 5.0 RIR, above your strength target of 1-4. Adding weight.",
  "basis": ["robinson2024", "currier2023"],
  "current_estimated_1rm": 134.9,
  "estimate_low_confidence": false,
  "below_strength_load_floor": true
}
```

## Errors

| Status | When | Body |
|---|---|---|
| 401 | Missing or invalid token | `{"detail": "..."}` |
| 422 | Request fails validation: empty `recent_sets`, `weight_kg` below 1.8, `rir` outside 0 to 5, unknown `goal` or `training_experience`, `rep_range_max` below `rep_range_min` | FastAPI's standard validation error body |
| 500 | Unexpected engine error | `{"detail": "..."}` |

The client should treat any non-200 as "no suggestion available" and fall back to pre-filling the user's last set.

## Citations for the "Why?" panel

`basis` contains keys only. To show the full citation, the client needs the text from `citations.json`.

**Proposed:** a second endpoint, `GET /citations`, returns the whole citations map as JSON. It's small and static, so the client can fetch it once and cache it. Not part of this contract until agreed.

## Known limitations (v1)

- The trend window uses the last 3 **sets**, not the last 3 **sessions**. If a user logs several sets per session, the window covers fewer sessions than the name implies.
- The recovery rule (48 hours after failure sets), fractional volume counting, and the split frequency warning are not in this endpoint yet.
- Suggestions are per exercise. Nothing here looks across a whole workout.

## Open questions

- **Nathaniel:** how the API verifies the Supabase token (JWT secret vs. Supabase's auth endpoint), and where it runs.
- **Aliyah:** is one request per exercise acceptable, or does the workout screen need a batch endpoint?
- **Everyone:** for sets under 1.8 kg, v1 returns 422. Would it be better to return a suggestion that just holds the last set and skips the 1RM?
