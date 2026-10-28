# Exercise demo videos

Every movement in APEX Workout can show a short looping demo clip. The videos come
from the [Free Exercise DB API](https://free-exercise-db-api.vercel.app/docs/api)
(MIT licensed), baked into the app at build time.

## Why the index is baked, not fetched live

The hosted API runs in demo mode and caps **4 requests per IP**, after which it
answers `429 { error: { code: "DEMO_LIMIT" } }`. APEX Workout is local-first, so the
client never calls the API: a script downloads the catalogue once and writes an
offline index that ships with both apps.

## Files

| Path | What it is |
| --- | --- |
| `scripts/sync-exercise-videos.mjs` | Refreshes the index from the API (or a local JSON file) |
| `apex-healthai/video-index.json` | Baked index for the web/Capacitor app (317 exercises) |
| `apex-healthai/video-guide.js` | Web player: name → demo resolution, variant toggle, sheet UI |
| `apex-workout-native/src/data/exercise-videos.json` | Baked index for the Expo app |
| `apex-workout-native/src/exercise-videos.ts` | Typed resolver + clip picker for the Expo app |

Each entry keeps the `male` and `female` clip URLs plus poster thumbnails, so the UI
can switch demonstrations without another request.

## Playback is a silent looping preview

Demos are shown as previews, not as a media library: **muted**, **autoplay**,
**loop**, `playsinline`, and **no native controls** (no scrub bar or fullscreen).
A small `LOOP` badge marks the frame. Audio is never played and the video element
is not interactive (`pointer-events: none` on web), so a demo can never hijack a
set mid-workout.

In the web app the element carries `muted`/`autoplay` attributes and the player
re-asserts `muted`, `defaultMuted`, `loop`, and `controls = false` before each
`play()`, because browsers block unmuted autoplay. On native, the expo-video
player sets `loop`, `muted`, and `volume = 0`, and `VideoView` mounts with
`nativeControls={false}` and `allowsFullscreen={false}`.

## Refreshing the index

```bash
# from data already downloaded (no request to the hosted API)
node scripts/sync-exercise-videos.mjs --from-file ./exercises.json

# against a self-hosted instance (unlimited requests when DEMO_MODE is off)
node scripts/sync-exercise-videos.mjs --base https://my-instance.example.com

# check whether the committed indexes are stale
node scripts/sync-exercise-videos.mjs --check
```

`--from-file` accepts either the raw `data/exercises.json` array from the
[free-exercise-db-api repo](https://github.com/luisaraujoc/free-exercise-db-api) or an
`/api/v1/exercises` response envelope.

## Matching workout movements to demos

Templates use generic names ("Cable or band row"), so both resolvers share an
override table that maps them to a catalogued variation ("Seated Cable Row (V-Grip)").
Failing an override, a token-overlap match is used and only accepted at ≥ 75 %
confidence. All 18 template movements currently resolve.

Bundled guides carry the same 317 ids as the video index, so guide → demo lookup is
an exact id match.

## Where it appears

- **Web app (`apex-healthai`)**: a `DEMO` button on every exercise in an active
  workout, plus a "Movement demos" list on the Plan page.
- **Native app (`apex-workout-native`)**: the exercise guide detail screen now plays
  the demo (was a placeholder panel), with a HIM/HER toggle.

## Attribution

Demo media and metadata: Free Exercise DB, MIT. See
`apex-workout-native/licenses/Free-Exercise-DB-API-MIT.txt` and
`apex-healthai/licenses/Free-Exercise-DB-API-MIT.txt`. Clips stream from the project's
public R2 bucket on demand, so playback needs a network connection; the rest of the
app stays fully offline.
