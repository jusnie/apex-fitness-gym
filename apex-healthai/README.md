# APEX Workout

A premium, local-first strength and nutrition tracker.

## Principles

- Initial setup, profile, and training preferences remain on the device.
- The intro video, typography, and icon font are bundled locally.
- The application makes no runtime network requests.
- Cloud sync is deferred until the local workout experience is complete.

## Local preview

```bash
npm start
```

## Android packaging preparation

```bash
npm run android:sync
npm run android:open
```

These commands prepare the Android project; they do not create an APK.
