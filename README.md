# IRON

IRON is a free, open-source workout tracker for iOS and Android. It tracks training on specific equipment and is being built to give progression suggestions based on how hard each set felt.

## What makes it different

1. **Your rep ranges belong to you.** Set a range per exercise; future suggestions will stay inside it.
2. **Effort-based progression.** The planned engine uses reps in reserve (RIR) rather than a generic percentage table.
3. **Per-machine history.** The same movement on different equipment keeps separate training history.

The progression research is collected in [docs/research.md](docs/research.md).

## Status and tech stack

Active development, Fall 2026. This is a mobile-first rebuild of an earlier web prototype.

- **Client:** React Native (Expo SDK 57) and TypeScript in `app/`; iOS and Android primary, web secondary
- **Data layer:** Supabase (PostgreSQL) for authentication and workout data, with row-level security
- **Algorithm service:** Python (FastAPI) in `api/` for progression logic
- **Schema:** SQL migrations and RLS policies planned in `supabase/`

## Run the Expo app

Use Node.js LTS. From the repo root:

```sh
cd app
npm ci
npm start
```

Scan the QR code with a compatible Expo Go build, or press `i` for an iOS Simulator / `a` for an Android emulator if one is installed. Run `npm run web` for the secondary web target.

The App Store version of Expo Go on a physical iPhone supports SDK 54. Testing this SDK 57 client on a physical iPhone requires a compatible Expo Go build distributed through TestFlight or a project development build. An iOS Simulator can install an SDK 57-compatible Expo Go build. To sign in to Expo CLI using a GitHub-backed Expo account, run `npx expo login --browser` from `app/`.

If Metro reports `Unexpected end of JSON input` while bundling, stop the server and run `npm run start:clear` from `app/`.

## Current client scope

The app opens directly to Home, Splits, Workout, History, and Progression. Account creation and onboarding are deferred. Workout set entry is local draft state; saving to Supabase is pending. Splits, history, and progression show starter content until the schema and RLS policies are ready.

Routes live in `app/src/app/`. Expo Router maps each route file to a screen; `_layout.tsx` defines the tabs. Shared page styling lives in `app/src/components/page-shell.tsx`.

Database credentials are not needed to run the current UI. When the Supabase connection is added, copy `.env.example` to a local `.env` and fill in your own values. Never commit `.env` or a service-role key.

## Documentation

- [Planning doc](docs/IRON%20Planning.pdf) — MVP scope, user flow, ownership, and build phases
- [Research library](docs/research.md) — studies behind the progression engine

## License

MIT — see [LICENSE](LICENSE).
