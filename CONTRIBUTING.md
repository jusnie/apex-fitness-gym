# Contributing to Apex Fitness Gym

Thanks for helping improve Apex Fitness Gym.

## Before you begin

- Open a pull request for focused fixes and small improvements.
- Open an issue before starting a significant feature or architectural change.
- Keep the local-first workout experience fast, reliable, and accessible.
- Cloud, sharing, challenge, and coach/client work must preserve offline usability and clear user consent.

## Set up

```bash
flutter pub get
flutter analyze
flutter test
flutter run
```

Use the Flutter and Dart versions declared by the project tooling. Test visual changes on a physical Android device when possible.

## Where to work

```text
lib/app/       app identity, navigation, and shared configuration
lib/screens/   product screens
lib/state/     application state
lib/services/  storage, backup, widgets, and integrations
lib/theme/     Apex visual systems
assets/        branded and exercise assets
website/       Vite / React product site
```

## Pull-request checklist

- Keep each pull request focused and explain the user impact.
- Add or update tests for behavior changes.
- Run `dart format` on edited Dart files.
- Do not introduce tracking or remote behavior without an explicit, privacy-conscious product decision.
- Do not remove the GPLv3, required fork attribution, or CC BY-SA artwork notices.

## Licensing

Contributions are accepted under this repository's [GPL-3.0 license](LICENSE). See [NOTICE.md](NOTICE.md), [ADDITIONAL_TERMS.md](ADDITIONAL_TERMS.md), and [CREDITS.md](CREDITS.md) for distribution requirements.
