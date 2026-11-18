# `GET /citations` Endpoint Contract

**Status:** Draft, awaiting sign-off
**Owner:** Olakiite
**Consumers:** Frontend (Aliyah)
**Source of truth:** `api/app/data/citations.json`

## Purpose

Every engine suggestion returns a `basis` field naming the evidence behind it (for example `"robinson2024"`). This endpoint lets the app turn that key into a readable citation: authors, title, link, what the paper found, and its caveats. It serves the research data as-is. It does no computation.

## Request

```
GET /citations
```

- No body, no query parameters.
- **Auth: none.** The data is public research metadata and is identical for every user. Open question 1 asks the team to confirm.

## Response: 200 OK

```json
{
  "meta": {
    "description": "Machine-readable citations for IRON's progression engine...",
    "last_updated": "2026-09-18"
  },
  "citations": {
    "robinson2024": {
      "authors": "Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC",
      "year": 2024,
      "title": "Exploring the Dose-Response Relationship Between...",
      "journal": "Sports Medicine",
      "volume": "54(9)",
      "pages": "2209-2231",
      "doi": "10.1007/s40279-024-02069-2",
      "url": "https://doi.org/10.1007/s40279-024-02069-2",
      "type": "meta-regression",
      "access": "abstract",
      "finding": "Strength gains were similar across a wide RIR range...",
      "caveats": "Authors call the analysis exploratory..."
    }
  }
}
```

The API renames `_meta` in the JSON file to `meta` and moves the entries under `citations`. This keeps entry keys separate from metadata, so the client never has to skip a key that starts with an underscore.

### Entry fields

| Field | Type | Always present | Notes |
|---|---|---|---|
| `authors` | string | yes | Display string, already formatted |
| `year` | integer | yes | |
| `title` | string | yes | |
| `journal` | string | yes | Preprints use the server name (e.g. "SportRxiv preprint") |
| `type` | string | yes | e.g. `meta-analysis`, `meta-regression`, `original research`, `preprint` |
| `access` | string | yes | How much of the paper we have read: `full text`, `abstract`, `not yet read` |
| `finding` | string | yes | One to three sentences, plain language |
| `url` | string | yes | Link the app should open |
| `doi` | string | most | Bare DOI. Missing or non-DOI for some entries |
| `volume`, `pages` | string | no | |
| `caveats` | string | no | Show in the UI. Several entries carry real limitations |
| `superseded_by` | string | no | Another citation key. If present, the UI should point to the newer entry |
| `data_url`, `alt_url` | string | no | Extra links (dataset, alternate source) |
| `formula`, `language`, `note` | string | no | Present on a few entries only |

Treat every field except the first group as optional. The client must not crash when one is missing.

## Linking to the engine

Each `basis` value returned by `POST /progression/suggest` is a key in `citations`. A client can fetch `/citations` once, then look up any `basis` locally. If a `basis` key is not found, show the raw key instead of failing.

## Caching

- The data changes only when a developer edits `citations.json` and redeploys.
- Server sends `Cache-Control: public, max-age=3600`.
- The client should fetch once per app launch and keep it in memory. Compare `meta.last_updated` to detect a newer version.

## Errors

| Status | When |
|---|---|
| 500 | `citations.json` is missing or unreadable. Body: `{"detail": "Citations unavailable"}` |

No 401, no 422, since there is no auth and no input.

## Implementation notes (for when this is approved)

- Load the JSON once at startup, not per request.
- Pydantic response model with the optional fields above.
- Route in `api/app/routers/citations.py`, mounted in `main.py`.
- Tests: 200 shape, `meta` and `citations` present, every `superseded_by` value is itself a key, every `basis` key used in `constants.py` exists in `citations`.

## Open questions

1. **Auth:** OK to leave this endpoint public? Everything else uses the bearer stub.
2. **Single lookup:** Do we also want `GET /citations/{key}`, or is fetching the whole map (20 entries) enough?
3. **Data fixes before launch:**
   - `remmert2025.doi` currently holds an arXiv URL (`10.48550/arXiv.2603.17495`) that looks like the Marzagão paper's ID. Needs checking against the SportRxiv preprint.
   - Sync `docs/research.md` with `citations.json` (older keys `vbt_free_weight_inaccurate` and `one_rm_exercise_dependent` versus the renamed `macarilla2022` and `meneses2013`; reynolds2006 status).
4. **UI:** How should the app show `access: "not yet read"` entries? Hide them, or label them honestly?