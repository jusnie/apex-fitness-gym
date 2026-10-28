# Athletly source audit — rebrand evaluation

**Audit date:** 2026-10-28  
**Source reviewed:** `https://github.com/RnltLabs/athletly-app`  
**Snapshot:** `ca18b42504f19c351195236d94e0cf18ef760465` (shallow checkout)

## License conclusion

The reviewed checkout includes an MIT License with `Copyright (c) 2026 Roman Reinelt`.

MIT permits use, modification, redistribution, sublicensing, and sale, provided that the original copyright and permission notice remain in copies or substantial portions of the Software. APEX may use code from this repository only with that license notice retained. The MIT license does not grant rights in the Athletly name, logo, service, hosted API, user data, credentials, or any third-party material that may be subject to separate terms.

## Android / APK conclusion

This is an Expo 55 / React Native 0.83 project. It has scripts for `expo run:android`, but the snapshot does not include:

- an `android/` native directory;
- an `eas.json` APK build profile;
- a release APK; or
- an Android release workflow (the only workflow runs TypeScript type checking).

It can be configured to generate Android artifacts after an APEX Expo configuration and native prebuild. No APK has been generated during this audit.

## Rebrand blockers found

| Area | Finding | Required APEX action |
| --- | --- | --- |
| Package identity | `app.json` uses `Athletly`, `athletly`, scheme `athletly`, and Android package `com.athletly.app`. | Replace all with APEX identity and `com.apexworkout.com`. |
| Icons/splash | All six tracked raster icon/splash assets are Athletly assets with no separate asset provenance file. | Remove and replace all with the supplied APEX assets. |
| Visual identity | The active UI is a light blue/violet, German-language multi-sport design. | Replace the visible copy, color system, styles, and component presentation with APEX black/red/white gym-first design. |
| Remote API | `lib/api.ts`, `store/chatStore.ts`, and `hooks/useChatStream.ts` default to `https://athletly.rnltlabs.de`. | Remove the default remote service. Do not send any APEX user data to it. |
| Supabase | Auth/data stores require `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. | Remove from the offline core or supply an independently controlled, audited APEX backend later. |
| Coaching backend | The chat/plan features use server-sent events and the separate Athletly backend. | Remove/replace; do not imply that Athletly backend access transfers to APEX. |
| Health, Garmin, voice, notifications | Native integrations, microphone permission, HealthKit/Health Connect, Garmin account flows, and push token handling are present. | Exclude from the initial offline APEX build unless each permission, privacy disclosure, data flow, and service agreement is independently implemented and audited. |
| Functional scope | The source contains approximately 16,947 TypeScript/TSX lines and 75 components. It is an online AI coaching product, not a self-contained workout APK. | Use only the portions that are appropriate for APEX; prioritize an independent local workout core. |

## Secret and endpoint scan

- No credential-shaped literal was found by a static scan of the checkout.
- There is no `.env` tracked in the checkout.
- The project has no `.env.example`, so its required Supabase/API configuration is undocumented in the source tree.
- The `EXPO_PUBLIC_*` values are intentionally client-visible build configuration and must never contain private/service-role secrets.

## Approved path forward

A separate `apex-workout-native` workspace may be created from this audited snapshot to preserve the MIT notice while replacing all branding, bundled artwork, online service defaults, and unapproved integrations. The original Athletly checkout should remain untouched as a review record until the APEX native replacement is validated.

No APK build is authorized by this audit.
