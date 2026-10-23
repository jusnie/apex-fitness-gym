# Apex Fitness Gym — product plan

## Product position

Apex Fitness Gym is a **local-first strength-training platform**: work out and
log every set without a connection, then opt into a secure account for backup,
sync, coaching, community, challenges, and shared plans. The experience is
inspired by the clarity and speed of modern trackers such as Lyfta, but uses
Apex’s own product identity, copy, design system, and implementation.

## Design direction

- **Palette:** true black/graphite surfaces, performance red primary actions,
  soft red progress states, white data typography.
- **Voice:** direct and athletic — short labels, strong hierarchy, no clutter.
- **Workout flow:** one prominent action; routine first; prior performance next
to the set fields; fast complete-set controls; rest timer always visible.
- **Do not copy:** Lyfta assets, logos, exact layouts, source code, or branded
  language. Use it only as high-level experience inspiration.

## Phased delivery

### 0. Brand and local-first foundation — now

- [x] Apex Fitness Gym product identity and distinct Android package.
- [x] Black, graphite, and red theme system.
- [x] Core exports and user-visible sharing rebranded.
- [x] Required GymMane GPLv3 attribution shown in the legal/About screen.
- [x] Android prepared for secure online connectivity.

### 1. Fast workout MVP

- Rework the home `Start workout` route for routine-first, quick logging.
- Surface previous set/rep/weight performance in every exercise row.
- Add a compact set-completion action, rest timer, warm-up/drop/superset tags,
  session summary, PR celebrations, and fast exercise search.
- Replace the remaining old product wording, filenames, and artwork/icon pack.

### 2. Account and optional cloud sync

- Email/password plus OAuth account creation and session recovery.
- Keep the existing device store as the source of truth while offline.
- Add an outbox, optimistic versioning, conflict rules, encrypted transport,
  manual sync, automatic sync, and a clear account/data-deletion path.
- Sync user profile, exercises, routines, sessions, notes, measurements, and
  media metadata; upload private media only when sync is enabled.

### 3. Social and coaching

- Public/private profile controls; follow requests and blocking.
- Friends feed with explicit share controls; shared workouts and routines.
- Coach organisations, invite-only clients, plan assignment, check-ins, and
  scoped progress views. Coaches never receive private data by default.

### 4. Motivation layer

- Private or opt-in leaderboards, gym/team challenges, streaks, milestones,
  notifications, moderation/reporting, and abuse controls.

## Required launch decisions

1. A dedicated backend project and production owner/support address.
2. Privacy policy, terms, age policy, data deletion workflow, and moderation
   policy before social features ship.
3. Original Apex icon, screenshots, store artwork, and an open-source GitHub
   repository containing the GPLv3 source.
4. Security review of row-level permissions and a private beta before public
   sync/community release.
