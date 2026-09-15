# IRON-Workout-App

# IRON

A free, open-source workout tracker for iOS and Android that gives progression suggestions based on how hard your sets actually felt.

## What makes it different

Most trackers either hand you a fixed program or just store numbers. IRON is built around three ideas:

1. **Your rep ranges belong to you.** You set the range per exercise. IRON adjusts weight and reps *within* it and never overrides it.
2. **Effort-based progression.** Suggestions are driven by reps in reserve (RIR) — how many reps you had left — not a generic percentage table.
3. **Per-machine history.** The same movement on different equipment is tracked separately, so your history stays accurate across gyms.

The progression logic is grounded in peer-reviewed research. Every rule the engine applies traces back to a paper in [`docs/research.md`](docs/research.md).

## Status

Active development, Fall 2026. This is a from-scratch rebuild of an earlier web prototype, now targeting mobile first.

## Tech Stack

- **Client:** React Native (Expo), TypeScript — iOS and Android primary, web secondary
- **Data layer:** Supabase (PostgreSQL) — auth, storage, row-level security
- **Algorithm service:** Python (FastAPI) — progression logic only

## Repo Structure

app/ React Native (Expo) client
api/ FastAPI service for progression logic
supabase/ Schema SQL, migrations, RLS policies
docs/ Planning doc, ERD, research library


## Documentation

- [Planning doc](docs/IRON_Planning.pdf) — MVP scope, user flow, ownership, build phases
- [Research library](docs/research.md) — the studies behind the progression engine
- [Contributing](CONTRIBUTING.md) — branch naming, PR process, local setup

## Getting Started

Setup instructions coming once the Expo and FastAPI scaffolds land.

Copy `.env.example` to `.env` and fill in your own values. Never commit `.env`.


## License

MIT — see [LICENSE](LICENSE).