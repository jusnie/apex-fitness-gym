# Apex Fitness Gym

**Apex Fitness Gym** is a local-first training companion for fast workout logging, routines, progress, challenges, and coach/client foundations.

- **Website:** [apexfitnessgym.cc.cd](https://apexfitnessgym.cc.cd)
- **Source code:** [github.com/jusnie/apex-fitness-gym](https://github.com/jusnie/apex-fitness-gym)
- **Android download:** [`releases/Apex-Fitness-Gym-v0.1.0-arm64-release.apk`](releases/Apex-Fitness-Gym-v0.1.0-arm64-release.apk)

## What Apex does

- Start, log, and complete workouts with routines, rest timing, notes, and history.
- Track volume, trends, personal records, body measurements, and training progress.
- Work offline first, with optional cloud-sync foundations when a connection is available.
- Use community, challenge, leaderboard, profile-sharing, and coach/client foundations.
- Choose the focused **Default** visual system or the **Liquid Glass** Beta theme.
- Use Apex-branded launcher assets, onboarding, profile background, and About information.

## Build locally

```bash
flutter pub get
flutter analyze
flutter run
```

For an Android release build, use Flutter's Android build workflow. The retained release APK is ARM64-only.

## Project structure

```text
lib/        Flutter application source
android/    Android integration, launcher, widgets, and native bridges
assets/     App artwork, exercise data, and Apex visual assets
supabase/   Optional cloud platform migrations
website/    Vite / React official product website
releases/   Retained distributable APK
```

## Open-source notices

Apex Fitness Gym is a GPLv3 fork of GymMane. **Required attribution: Based on GymMane by InlitX.**

- The code remains distributed under [GPLv3](LICENSE).
- GymMane's required additional terms remain in [ADDITIONAL_TERMS.md](ADDITIONAL_TERMS.md).
- Exercise illustration credits and their CC BY-SA 4.0 requirements remain in [CREDITS.md](CREDITS.md).
- Distribution notices are retained in [NOTICE.md](NOTICE.md).

Any public distribution of this app must provide complete corresponding source and preserve these legal notices.
