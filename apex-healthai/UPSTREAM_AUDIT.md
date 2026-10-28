# HealthAi starter audit and APEX release boundary

**Audit date:** 2026-10-28  
**Audited snapshot:** `shovamdestroyer/HealthAi` commit `ac4cd3182cbbd1ad5cc61d5f89b2816429b08802`  
**Clone scope:** shallow, single-commit checkout. This audit cannot make claims about earlier upstream history.

## Finding

The starter repository is **not a reliable licensing basis** for APEX Workout. Its `package.json` declared `MIT`, but the checked-out tree had no `LICENSE`, `COPYING`, notice, or other license text. No source-file license headers were retained as a basis for a redistribution claim.

APEX Workout therefore does **not** ship the starter application's source, user interface, API/server code, tests, data, configuration, image assets, CDN integrations, or dependency set. The current APEX application has independently authored HTML, CSS, JavaScript, manifest, service worker, static preview server, documents, Android configuration, and local training data structures.

The APEX `LICENSE` applies only to the current APEX-authored source and must not be read as relicensing HealthAi or any other upstream project.

## Snapshot findings

| Area | Observed in the starter snapshot | APEX disposition |
| --- | --- | --- |
| License | `package.json` said `MIT`; no license file or license notice was present. | Not reused or relied upon. |
| Server/API | Express/CORS/dotenv server with profile, food, water, workout, AI, and health endpoints. | Removed. APEX uses a small Node static-file preview server only. |
| Cloud/credentials | `.env.example` named Gemini and Supabase variables. The snapshot key-pattern scan found no credential-looking literal values. | Removed. APEX has no cloud configuration, client token, or runtime API request. |
| External runtime assets | Google Fonts, MediaPipe CDN, and Supabase CDN references; MediaPipe resources were requested at runtime. | Removed. Fonts and the icon font are locally bundled. |
| App behavior/data | Yoga, nutrition, profile, water, workout, chatbot, and API-oriented source and tests. | Removed. No starter data catalog or media remains in the active application. |
| Dependency set | Express, cors, and dotenv supported the inherited server. | Removed from APEX dependencies. |
| Secrets assurance | The checkout is shallow and cannot prove the absence of secrets in unavailable upstream history. | No inherited `.env` or credentials are included in the active tree. Rotate any credentials ever used with the former project before a public deployment. |

## Active APEX runtime checks

- The active browser/WebView code contains no API endpoint, cloud SDK, CDN, or external stylesheet URL.
- Profile, active workout, completed session, and meal-log data use device-local browser/WebView storage only.
- The active Android web bundle contains its own app shell, APEX assets, local Sora and Manrope fonts, and local Phosphor Icons font.
- The only network-style request in the service worker is the standard cache fallback for an uncached same-origin app-shell request; the active app shell is pre-cached and makes no remote application request.
- No GymMane source, exercise catalog, exercise art, media, data, or notices were transferred into this project.

## Bundled third-party materials

Only the following third-party runtime materials are currently bundled:

- Capacitor Android wrapper — MIT; full text in `licenses/Capacitor-MIT.txt`.
- Phosphor Icons web font — MIT; full text in `licenses/Phosphor-Icons-MIT.txt`.
- Sora variable font — SIL Open Font License 1.1; full text in `licenses/Sora-OFL-1.1.txt`.
- Manrope variable font — SIL Open Font License 1.1; full text in `licenses/Manrope-OFL-1.1.txt`.

See `THIRD_PARTY_NOTICES.md` for the distribution notice index. The license texts are copied into `www/licenses/` and then into the Capacitor Android public assets during `npm run android:sync`.

## Release gate

This local source tree is intentionally offline-first and is suitable to continue as a clean APEX implementation. Before a public release, still perform normal release checks: review the final dependency lockfile for security updates, validate Android signing and privacy disclosures, and obtain advice from qualified counsel for the chosen public licensing and trademark posture.
