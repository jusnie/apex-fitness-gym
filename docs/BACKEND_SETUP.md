# Apex Cloud setup

Apex Fitness Gym is **local-first**. Cloud services only activate in builds
that supply both compile-time values below; without them, the workout tracker
opens and works offline as usual.

## Backend created for this fork

- **Project:** Apex Fitness Gym
- **Region:** Singapore (`ap-southeast-1`)
- **Supabase reference:** `titfgsbwicqphxtvhppm`
- **URL:** `https://titfgsbwicqphxtvhppm.supabase.co`
- **Authentication:** email/password enabled, email confirmation enabled,
  mobile callback allowlisted as `apexfitness://auth-callback`

The SQL source of truth is in `supabase/migrations/`. The production project
has the matching migrations applied:

1. `apex_platform_foundation` — private profiles, local-first document sync,
   connection/coaching/social/challenge foundations, and RLS.
2. `atomic_sync_writes` — versioned compare-and-swap document writes to avoid
   stale offline devices silently overwriting cloud data.

## Configure a development build

1. Open the project’s **API Keys** page in Supabase and copy its
   **publishable** client key. Never put a `secret`/service-role key in Flutter.
2. Keep a local file at `env/apex_backend.env` (ignored by Git), based on
   `env/apex_backend.env.example`.
3. Pass the values when you run or build:

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://titfgsbwicqphxtvhppm.supabase.co \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

`ApexCloud.initialize()` is failure-tolerant: a missing or invalid cloud
configuration falls back to local-only mode rather than blocking a workout.

## Security rules

- Browser/mobile clients use the **publishable** key only; server secrets stay
  in Supabase Edge Function secrets, never the app or Git repository.
- All user-data tables have Row Level Security enabled. Raw training documents
  are owner-only; public profile/feed sharing requires an explicit separate
  post.
- Account confirmation is enabled. Before public launch, add a production web
  Site URL, transactional SMTP, rate-limit/captcha settings, a privacy policy,
  deletion workflow, and moderation endpoints.
- The database password is an admin credential, not a Flutter credential.
  Reset it in the Supabase dashboard before production if it was typed into a
  chat or shared anywhere else.
