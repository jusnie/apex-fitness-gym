# APEX Workout Native — notices

## APEX source

APEX-authored application code is provided under the MIT License in `LICENSE-APEX` and `licenses/APEX-Workout-MIT.txt`.

## Athletly upstream review record

The source review began from `RnltLabs/athletly-app`, snapshot `ca18b42504f19c351195236d94e0cf18ef760465`. Its MIT copyright and permission notice is retained verbatim in the root `LICENSE` and `licenses/Athletly-Upstream-MIT.txt`.

The active APEX source tree does not include the former Athletly application source, UI assets, backend endpoint, Supabase configuration, Garmin integration, voice flow, health-data integrations, or original app branding. The review boundary and findings are recorded in `ATHLETLY_AUDIT.md`.

## Exercise-guide metadata

APEX includes a local, minimized exercise-guide metadata catalog derived from the MIT-licensed metadata declared by [`imjosiel/free-exercise-db-api`](https://github.com/imjosiel/free-exercise-db-api). The retained MIT text is at `licenses/Free-Exercise-DB-API-MIT.txt`; scope and exclusion details are in `EXERCISE_GUIDE_PROVENANCE.md`.

Only metadata is included: exercise names and aliases, body parts, target and secondary muscles, equipment, difficulty, descriptions, instructions, form cues, common mistakes, and breathing notes. Upstream application code, video URLs, thumbnails, MP4 media, downloader scripts, and other media are excluded from APEX.

## Runtime dependencies

- **Expo, Expo Router, Expo Video, Expo Image Picker, Expo Font, Expo Linear Gradient, Expo Status Bar** — MIT. Full text: `licenses/Expo-Family-MIT.txt`.
- **React** — MIT. Full text: `licenses/React-MIT.txt`.
- **React Native** — MIT. Full text: `licenses/React-Native-MIT.txt`.
- **AsyncStorage for React Native** — MIT. Full text: `licenses/AsyncStorage-MIT.txt`.
- **Lucide React Native** — ISC. Full text: `licenses/Lucide-ISC.txt`.
- **React Native SVG** — MIT. Full text: `licenses/React-Native-SVG-MIT.txt`.
- **React Native Safe Area Context** — MIT. Full text: `licenses/Safe-Area-Context-MIT.txt`.
- **React Native Screens** — MIT. Full text: `licenses/React-Native-Screens-MIT.txt`.
- **Expo Google Fonts Material Symbols package** — MIT package license. Full text: `licenses/Expo-Material-Symbols-MIT.txt`.
- **Material Symbols font files pulled by Expo Router** — Apache License 2.0. Full text: `licenses/Material-Symbols-Apache-2.0.txt`.
- **Sora variable font** — SIL Open Font License 1.1. Full text: `licenses/Sora-OFL-1.1.txt`.
- **Manrope variable font** — SIL Open Font License 1.1. Full text: `licenses/Manrope-OFL-1.1.txt`.

## APEX-provided assets

The application icon, adaptive-icon foreground, splash mark, favicon, and intro video are copied from the retained `/home/user/apex-assets/` asset pack. No Athletly raster asset is bundled in this workspace.
