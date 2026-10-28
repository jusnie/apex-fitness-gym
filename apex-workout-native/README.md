# APEX Workout Native

APEX Workout Native is a gym-first, offline-first Android/iOS app built with Expo and React Native.

## Current local features

- Full-screen bundled APEX video intro that automatically transitions into onboarding when playback ends.
- Local-only onboarding: preferred name, optional profile photo, kg/lb selection, snapping number wheels, frequency, and training location.
- APEX black, red, and white training dashboard with locally bundled Sora display and Manrope interface fonts.
- Local workout templates, live set logging, a rest timer, completed-session volume, plan, history, progress, profile, and daily fuel log.
- Local storage only. The current source has no APEX cloud endpoint, Supabase client, coach backend, Garmin integration, microphone permission, notification service, or health-data integration.

## Android identity

- Display name: `APEX Workout`
- Android package: `com.apexworkout.com`
- Expo scheme: `apexworkout`

## Commands

```bash
npm install
npm run typecheck
npm start
npm run android:prepare
```

`android:prepare` creates Expo's native Android project but does not create an APK. No APK may be built without the project owner's fresh approval.

`eas.json` contains an internal-distribution APK profile for a future approved test build and an AAB production profile for a future store release. Neither profile has been run.

## Provenance and notices

This workspace was evaluated from the MIT-licensed Athletly source snapshot documented in `ATHLETLY_AUDIT.md`. The active APEX implementation was rewritten as a separate local workout core; the original Athletly app source, branding raster assets, backend defaults, Supabase integration, wearables, voice, push, and German UI were removed from this workspace.

The original upstream MIT notice is retained in `LICENSE` and `licenses/Athletly-Upstream-MIT.txt`. APEX-authored source is licensed under `LICENSE-APEX`. See `THIRD_PARTY_NOTICES.md` and the `licenses/` directory for required notice texts.
