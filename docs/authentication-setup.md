# Account setup and verification

## Screen preview while Supabase is unavailable

In an Expo development build, choose **Preview screens without an account** on Sign in. The banner labels every screen as preview and provides Exit preview. Signup uses sample fields; **Simulate email verification** opens the sample account and onboarding. You can build a split, open Profile, edit the sample name, and simulate changing a password. Preview sends no auth requests or emails and stores no passwords. Its workout data is held in a separate in-memory store and cleared on exit/reload. Production builds cannot activate preview (`__DEV__` guard). It does not test real authentication or email delivery.

The app uses Supabase Auth for email/password accounts. First/last name and the onboarding preference live in user metadata; the join date comes from `user.created_at`. Metadata is not an authorization mechanism.

## Local configuration

Copy `app/.env.example` to `app/.env.local`. In Supabase's Connect dialog, copy the project URL and **publishable** key into the matching variables. Never use a secret/service-role key in the app. Restart Expo after changing environment variables. These files are ignored by Git.

In Supabase Authentication:

- Enable Email signup and email confirmation.
- Set the minimum password length to at least 8 characters, matching the app's validation.
- Add `ironworkout://auth-callback` to the redirect allowlist for installed development/production builds.
- Add the exact web callback URL for the port in use, e.g. `http://localhost:8082/auth-callback`, plus the production HTTPS callback when deployed.
- Expo Go has a different generated `exp://.../--/auth-callback` URL. Use a development build with the registered scheme for reliable mobile email-link testing, or allowlist the exact Expo Go development URL.
- Keep email templates pointing to Supabase's confirmation URL. The app consumes returned session tokens on the callback route; it also supports exchanging a returned PKCE code.
- Configure production email delivery before public signup. Supabase's default email service has delivery and rate restrictions.

No database migration is required for this auth UI. Workout plans and sessions are stored **on the device**, separated by Supabase user ID, with no seeded sample records. They do not sync between devices. Cloud persistence, database RLS, and backend JWT verification remain separate work.

## Verification

Run from `app/`:

```sh
node --test tests/accounts.test.cjs
npx tsc --noEmit
npx expo export --platform web
```

Type checking and export do not verify the hosted Auth configuration. Before shipping, use test accounts to check:

1. Signup validation; confirmation email; expired link; resend; return to app on web and native.
2. Login with invalid credentials and with an unconfirmed email.
3. First login opens split setup; Create opens the split builder; Skip opens Home with an empty split.
4. Force-close/reopen restores the session and local split; names/join date match the signed-in account.
5. Password reset email opens the new-password form on cold and warm launches; old password stops working.
6. Name changes persist; sign-out removes access to protected routes, including browser back navigation.
7. Switch between two accounts and verify workout plans/history never cross accounts.

Weekly streak counts Monday–Sunday weeks with at least one workout containing a completed set. An unfinished current week preserves last week's streak. Profile PRs count improvements to an exercise's best completed weight; the first weight establishes a baseline. These stats currently cover this device's history only.

References: [Supabase React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native), [native email redirects](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [Expo Supabase setup](https://docs.expo.dev/guides/using-supabase/).
