# APEX Native security review

**Review date:** 2026-10-28

## Active application boundary

- The active APEX code has no API URL, Supabase client, auth token, cloud database, SSE connection, analytics SDK, wearable integration, microphone permission, or push-notification setup.
- Profile, session, and meal data are saved through AsyncStorage on the device.
- The profile image is selected locally through the platform image picker.
- The intro MP4, icons, and fonts are bundled app assets; no UI font or icon CDN is used.

## Dependency status

`npm audit --omit=dev` on the Expo 55 dependency graph reported transitive advisory findings, including a critical `shell-quote` advisory and high-severity findings in Expo tooling dependency chains. This candidate has not been released or packaged as an APK.

Do not use `npm audit fix --force` blindly: Expo SDK dependency versions need to remain compatible as a set. Before an approved APK or store release, upgrade to a patched Expo SDK/dependency set, re-run `npm audit --omit=dev`, review the production dependency paths, and complete Android signing/privacy review.

## Deliberate exclusions from the initial APK

The following Athletly-era service categories were deliberately excluded pending independent design, consent, privacy policy, and security review:

- remote AI coach and server-sent events;
- Supabase authentication and cloud persistence;
- Garmin login/data sync;
- Health Connect and HealthKit;
- microphone/speech recognition; and
- push notifications.
