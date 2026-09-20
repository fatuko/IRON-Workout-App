# IRON Workout App

Expo/React Native client in [app](app/). The FastAPI and Supabase directories are reserved for the progression service and database migrations.

## Run the app

Use Node.js LTS. From the repo root:

```sh
cd app
npm install
npm start
```

If Metro reports `Unexpected end of JSON input` during bundling, stop the server and run `npm run start:clear` from `app/` to rebuild its transform cache.

Scan the QR code with Expo Go on a phone, or press `i` for an iOS simulator / `a` for an Android emulator if one is installed. `npm run web` starts the secondary web target.

The client uses Expo SDK 57. The App Store build of Expo Go on a physical iPhone supports SDK 54, so SDK 57 requires a compatible Expo Go build distributed through TestFlight or a project development build for physical-iPhone testing. An iOS Simulator can install an SDK 57-compatible Expo Go build. If Expo Go asks for CLI sign-in, use `npx expo login --browser` from `app/` and the same Expo account on the phone.

## Current scope

The app opens directly to Home, Splits, Workout, History, and Progression. Account creation and onboarding are deferred. Workout set entry is local draft state; the Save button explains that persistence is pending. Splits, history, and progression show starter content and will be connected to Supabase after the schema and RLS policies are ready.

Routes live in `app/src/app/`. Expo Router maps each route file to a screen; `_layout.tsx` defines the tab navigation. Shared page styling lives in `app/src/components/page-shell.tsx`.
