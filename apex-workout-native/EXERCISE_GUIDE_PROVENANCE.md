# APEX Exercise Guide Metadata Provenance

- **Source metadata:** `imjosiel/free-exercise-db-api`, fetched from its `main` branch on 28 October 2026.
- **Source declaration:** the upstream repository declares its code and exercise metadata to be MIT licensed. The retained MIT notice is at `licenses/Free-Exercise-DB-API-MIT.txt`.
- **What APEX includes:** a local, minimized metadata catalog in `src/data/apex-exercise-guide-metadata.json` (exercise identifiers, names, aliases, body part, target and secondary muscles, equipment, difficulty, descriptions, instructions, cues, mistakes and breathing notes).
- **What APEX explicitly excludes:** upstream thumbnails, video URLs, MP4 demo media, downloader scripts, and any upstream application/runtime code. The upstream repository says video ownership/provenance is unknown; no media from it is copied, embedded, streamed or otherwise displayed by APEX.
- **Integration:** `src/exercises.ts` is self-authored APEX adapter/search/matching logic. No upstream implementation code was copied.
