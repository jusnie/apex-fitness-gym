# Companion Onboarding — Athletly V2

> Specification for the companion-style onboarding flow.
> Replaces the previous chat-based onboarding with a step-by-step guided experience.
>
> Related: [Design System](./design-system.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Flow](#2-user-flow)
3. [Screen Specifications](#3-screen-specifications)
4. [Shared Components](#4-shared-components)
5. [State Management](#5-state-management)
6. [Voice Input & AI Parsing](#6-voice-input--ai-parsing)
7. [Health Integration](#7-health-integration)
8. [Backend Endpoints](#8-backend-endpoints)
9. [Auth Guard Changes](#9-auth-guard-changes)
10. [File Structure](#10-file-structure)
11. [Runna Comparison](#11-runna-comparison)

---

## 1. Overview

### Design Principles

- **Companion-Style, not Chat**: Each step is its own screen with a centered companion card
- **Voice-first, Text-fallback**: Large mic button centered, text field as alternative
- **Tiles for common answers**: Tap instead of type — reduces friction
- **Account creation last**: User invests in personalization first, then commits to sign-up (higher conversion)
- **Progress Dots**: 6 dots at the top (Welcome has none), showing current step
- **Skip only for Health**: All other steps require at least one selection

### Flow Summary

```
Welcome -> Sport -> Ziele -> Tage -> Health -> Summary -> Account
```

7 screens total. Estimated completion time: 3-4 minutes.

---

## 2. User Flow

```
App Start (not logged in)
|
+-- /(onboarding) Welcome Screen
    |
    +-- "Lass uns loslegen" --> Sport Selection
    |   |
    |   +-> Goals
    |       |
    |       +-> Available Days
    |           |
    |           +-> Health Connection
    |               |
    |               +-> Summary
    |                   |
    |                   +-> Account Creation
    |                       |
    |                       +-> Supabase Sign-Up
    |                       +-> POST /api/onboarding/setup
    |                       +-> POST /garmin/connect (if Garmin selected)
    |                       +-> Apple Health / Health Connect sync
    |                       +-> Redirect to /(tabs)
    |
    +-- "Ich habe bereits einen Account" --> /(auth)/login
```

---

## 3. Screen Specifications

### 3.1 Welcome Screen

**Route:** `app/(onboarding)/index.tsx`
**Progress Dots:** Hidden

```
+------------------------------------+
|                                    |
|        [Athletly Logo]             |
|        "Athletly"                  |
|        "Dein AI Fitness Coach"     |
|                                    |
|        [Companion Illustration]    |
|                                    |
|   [ Lass uns loslegen ]  (primary) |
|                                    |
|   "Ich habe bereits einen Account" |
|          (ghost link)              |
|                                    |
+------------------------------------+
```

**Design:**
- Gradient background (top portion), same as auth screens
- Logo centered on gradient
- Primary CTA button navigates to `/sport`
- Ghost link navigates to `/(auth)/login`

### 3.2 Sport Selection

**Route:** `app/(onboarding)/sport.tsx`
**Progress Dots:** Step 1 of 6

```
+------------------------------------+
|  [<-]    . o o o o o               |
|                                    |
|  +--------------------------------+|
|  |   "Welchen Sport machst du?"   ||
|  |                                ||
|  |  [Laufen]  [Radfahren]        ||
|  |  [Schwimmen]  [Gym]           ||
|  |  [Yoga]  [Triathlon]          ||
|  |                                ||
|  |  [Mic]  [________________]    ||
|  |         "Oder sag es mir..."  ||
|  |                                ||
|  |  Parsed: [Laufen] [Radfahren] ||
|  +--------------------------------+|
|                                    |
|   [ Weiter ]                       |
+------------------------------------+
```

**Behavior:**
- Sport tiles are multi-select (toggle on/off)
- Each tile shows sport icon + name (use `lib/sport-colors.ts` for colors)
- Voice input sends to `POST /api/onboarding/parse-voice` with `step: "sport"`
- AI response parsed into tags that appear below the input
- User can remove parsed tags by tapping X
- "Weiter" enabled when >= 1 sport selected (from tiles or parsed tags)

**Sport Options:**
| Sport | Color | Icon |
|-------|-------|------|
| Laufen | #3B82F6 (blue) | Running figure |
| Radfahren | #A855F7 (purple) | Bike |
| Schwimmen | #06B6D4 (cyan) | Waves |
| Gym | #F59E0B (amber) | Dumbbell |
| Yoga | #EC4899 (pink) | Lotus |
| Triathlon | #22C55E (green) | Medal |

### 3.3 Goals

**Route:** `app/(onboarding)/goals.tsx`
**Progress Dots:** Step 2 of 6

```
+------------------------------------+
|  [<-]    . . o o o o               |
|                                    |
|  +--------------------------------+|
|  |  "Was moechtest du erreichen?" ||
|  |                                ||
|  |  [Fitness verbessern]          ||
|  |  [Schneller werden]           ||
|  |  [Abnehmen]                   ||
|  |  [Wettkampf vorbereiten]      ||
|  |  [Gesundheit]                 ||
|  |                                ||
|  |  [Mic]  [________________]    ||
|  |  "z.B. Karlsruher Halb-      ||
|  |   marathon im September       ||
|  |   unter 1:30h"               ||
|  |                                ||
|  |  Parsed:                      ||
|  |  [HM] [Karlsruhe]            ||
|  |  [September] [unter 1:30h]   ||
|  +--------------------------------+|
|                                    |
|   [ Weiter ]                       |
+------------------------------------+
```

**Behavior:**
- Goal tiles are multi-select
- Free-text area is prominent — larger than on sport screen
- Voice input sends to `POST /api/onboarding/parse-voice` with `step: "goals"`
- Specific goals (race name, date, target time) are parsed into structured tags
- Tiles AND free-text can be combined
- "Weiter" enabled when >= 1 goal selected or free-text entered

### 3.4 Available Training Days

**Route:** `app/(onboarding)/schedule.tsx`
**Progress Dots:** Step 3 of 6

```
+------------------------------------+
|  [<-]    . . . o o o               |
|                                    |
|  +--------------------------------+|
|  |  "An welchen Tagen kannst du   ||
|  |   trainieren?"                 ||
|  |                                ||
|  |  [Mo] [Di] [Mi] [Do]          ||
|  |  [Fr] [Sa] [So]               ||
|  |                                ||
|  |  "Waehle alle Tage an denen   ||
|  |   du Zeit hast. Dein Coach    ||
|  |   plant das optimale           ||
|  |   Training fuer dich."        ||
|  +--------------------------------+|
|                                    |
|   [ Weiter ]                       |
+------------------------------------+
```

**Behavior:**
- 7 day buttons in a row/grid, toggle on/off
- Each button shows abbreviated day name (Mo, Di, Mi, Do, Fr, Sa, So)
- Selected days use primary color, unselected use surfaceMuted
- No voice input needed here — pure tap interaction
- Subtext explains that the coach determines training frequency
- "Weiter" enabled when >= 1 day selected

**Day Mapping:**
```
mon -> Montag (Mo)
tue -> Dienstag (Di)
wed -> Mittwoch (Mi)
thu -> Donnerstag (Do)
fri -> Freitag (Fr)
sat -> Samstag (Sa)
sun -> Sonntag (So)
```

### 3.5 Health Connection

**Route:** `app/(onboarding)/health.tsx`
**Progress Dots:** Step 4 of 6

```
+------------------------------------+
|  [<-]    . . . . o o               |
|                                    |
|  +--------------------------------+|
|  |  "Hast du einen Fitness-       ||
|  |   Tracker?"                    ||
|  |                                ||
|  |  iOS:                          ||
|  |  [Apple Health]  "Verbinden"  ||
|  |                                ||
|  |  Android:                      ||
|  |  [Health Connect] "Verbinden" ||
|  |                                ||
|  |  Both:                         ||
|  |  [Garmin Connect] "Verbinden" ||
|  |                                ||
|  +--------------------------------+|
|                                    |
|   [ Weiter ]                       |
|   "Spaeter einrichten" (ghost)    |
+------------------------------------+
```

**Behavior:**
- Platform-adaptive: iOS shows Apple Health, Android shows Health Connect
- Garmin always shown (both platforms)
- Apple Health: `useAppleHealth.connect()` — requests permissions directly
- Health Connect: `useHealthConnect.connect()` — requests permissions directly
- Garmin: Opens `GarminConnectModal` (existing component) for email/password
  - Credentials stored in onboarding store (no backend call yet — no auth)
  - Actual `/garmin/connect` call happens after account creation
- "Spaeter einrichten" skips this step (only step with skip option)
- "Weiter" always enabled (health connection is optional)
- Connected services show green checkmark

### 3.6 Summary

**Route:** `app/(onboarding)/summary.tsx`
**Progress Dots:** Step 5 of 6

```
+------------------------------------+
|  [<-]    . . . . . o               |
|                                    |
|  +--------------------------------+|
|  |  "So starten wir zusammen"     ||
|  |                                ||
|  |  Sport                         ||
|  |  [Laufen] [Radfahren]         ||
|  |                                ||
|  |  Ziel                          ||
|  |  [HM Karlsruhe unter 1:30h]   ||
|  |                                ||
|  |  Trainingstage                 ||
|  |  [Mo] [Mi] [Fr] [Sa]          ||
|  |                                ||
|  |  Verbunden                     ||
|  |  [Garmin Connect]             ||
|  |                                ||
|  +--------------------------------+|
|                                    |
|   [ Weiter ]                       |
+------------------------------------+
```

**Behavior:**
- Pure display screen — no input, no voice
- Reads all data from onboarding store
- Sport tags with sport colors
- Goals as text tags
- Selected days as small pills
- Connected health services with green checkmark
- Sections omitted if empty (e.g., no wearable connected)
- "Weiter" navigates to account creation
- User can go back to any previous step to change data

### 3.7 Account Creation

**Route:** `app/(onboarding)/create-account.tsx`
**Progress Dots:** Step 6 of 6

```
+------------------------------------+
|  [<-]    . . . . . .               |
|                                    |
|  +--------------------------------+|
|  |  "Fast geschafft!"             ||
|  |  "Erstelle dein Konto"         ||
|  |                                ||
|  |  [E-Mail Input]               ||
|  |  [Passwort Input]             ||
|  |  [Strength Indicator]         ||
|  |                                ||
|  +--------------------------------+|
|                                    |
|   [ Konto erstellen ]              |
|                                    |
|   "Bereits ein Konto? Anmelden"   |
+------------------------------------+
```

**Behavior:**
1. Email + Password form (reuse existing `Input` component)
2. Password strength indicator (from register.tsx)
3. On submit:
   a. `supabase.auth.signUp(email, password)` — creates Supabase user
   b. `POST /api/onboarding/setup` — sends all collected data with auth token
   c. If Garmin credentials stored: `POST /garmin/connect` with stored credentials
   d. If Apple Health/Health Connect connected: trigger initial data sync
   e. `authStore.setOnboarded(true)` — temporary flag while agent creates plan
   f. Clear onboarding store
   g. Redirect to `/(tabs)` — Coach tab shows welcome message
4. Error handling: Show inline error banner (same pattern as login/register)
5. "Bereits ein Konto? Anmelden" links to `/(auth)/login`

---

## 4. Shared Components

### 4.1 CompanionCard

Container for each onboarding step's main content.

```
Props:
  question: string        -- Main question text (large, centered)
  subtitle?: string       -- Optional explanation text below question
  children: ReactNode     -- Step-specific content (tiles, inputs, etc.)

Layout:
  Card variant="hero"
  Question: h1 size, textPrimary, centered
  Subtitle: bodySm, textSecondary, centered
  Children: below, with lg spacing
```

Styling follows [Design System > Card System > Hero Card](./design-system.md#5-card-system).

### 4.2 ProgressDots

Step indicator at the top of each screen.

```
Props:
  total: number           -- Total steps (6)
  current: number         -- Active step (0-indexed)

Layout:
  Horizontal row, centered
  Each dot: 8px circle
  Active: primary (#2563EB), slightly larger (10px)
  Completed: primary (#2563EB)
  Upcoming: surfaceMuted (#E8EBF0)
  Gap: 8px between dots
```

See [Design System > Progress Indicators > Dot Indicators](./design-system.md#9-progress-indicators).

### 4.3 SelectableTile

Tappable tile for sport/goal selection.

```
Props:
  label: string
  icon?: LucideIcon | ReactNode
  color?: string          -- Accent color for selected state
  selected: boolean
  onPress: () => void

Layout:
  Unselected: surfaceNested bg, rounded-[14px], border divider
  Selected: primaryLight bg, border primary, icon/text in primary color
  Size: flexible grid (2 columns for sports, 1 column for goals)
  Height: 56px
  Icon left, label right
  Haptic feedback on press
```

### 4.4 DayPicker

Row of 7 toggleable day buttons.

```
Props:
  selectedDays: DayOfWeek[]
  onToggle: (day: DayOfWeek) => void

Layout:
  Horizontal row, evenly spaced
  Each button: 44x44px circle
  Unselected: surface bg, border divider, textSecondary
  Selected: primary bg, white text
  Label: 2-letter abbreviation (Mo, Di, Mi, Do, Fr, Sa, So)
```

### 4.5 VoiceTextInput

Combined voice recording button + text input.

```
Props:
  value: string
  onChangeText: (text: string) => void
  onVoiceResult: (transcript: string) => void
  placeholder?: string
  isProcessing?: boolean  -- Show loading state during AI parsing

Layout:
  Row: [Mic Button 48px] [TextInput flex-1]
  Mic button: primary bg when idle, error bg when recording
  TextInput: standard input styling (see Design System)
  Below: Loading indicator when AI is parsing voice input
```

Uses existing `useVoiceInput` hook for speech-to-text.

### 4.6 ParsedTags

Display AI-parsed results as removable tag pills.

```
Props:
  tags: string[]
  onRemove: (tag: string) => void
  color?: string          -- Tag accent color

Layout:
  Flex-wrap row
  Each tag: pill shape, primaryLight bg, primary text
  X button on each tag for removal
  Animated entrance (fade in)
```

---

## 5. State Management

### OnboardingStore (Zustand)

**File:** `store/onboardingStore.ts`

```typescript
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type WearableType = 'garmin' | 'apple_health' | 'health_connect';

interface OnboardingState {
  // Step data
  sports: string[];
  customSport: string | null;
  goals: string[];
  customGoal: string | null;
  availableDays: DayOfWeek[];
  wearable: WearableType | null;
  garminCredentials: { email: string; password: string } | null;

  // Navigation
  currentStep: number;

  // Actions (immutable updates)
  toggleSport: (sport: string) => void;
  setCustomSport: (text: string | null) => void;
  toggleGoal: (goal: string) => void;
  setCustomGoal: (text: string | null) => void;
  toggleDay: (day: DayOfWeek) => void;
  setWearable: (type: WearableType | null) => void;
  setGarminCredentials: (creds: { email: string; password: string } | null) => void;
  setStep: (step: number) => void;
  reset: () => void;
}
```

**Persistence:** None needed. Data lives only during onboarding flow. After account creation, data is sent to backend and store is reset.

**Garmin credentials:** Stored temporarily in memory only. Never persisted to AsyncStorage. Cleared after `/garmin/connect` call or on reset.

---

## 6. Voice Input & AI Parsing

### Flow

```
User speaks --> useVoiceInput (de-DE) --> transcript
    |
    v
POST /api/onboarding/parse-voice (public, rate-limited)
    { text: transcript, step: "sport" | "goals" }
    |
    v
Backend: LiteLLM chat_completion (gemini/gemini-2.0-flash-lite)
    System prompt: "Extract {sports|goals} from user text. Return JSON."
    |
    v
Response: { items: ["Laufen", "Radfahren"] }
    |
    v
Frontend: Display as ParsedTags (animated entrance)
    User can remove tags or accept and continue
```

### Backend Endpoint

**Route:** `POST /api/onboarding/parse-voice`
**Auth:** None (public). Rate-limited: 10 requests per IP per hour.
**Model:** `gemini/gemini-2.0-flash-lite` via LiteLLM (cheapest option)

```python
class ParseVoiceRequest(BaseModel):
    text: str                        # Voice transcript
    step: Literal["sport", "goals"]  # Context for parsing

class ParseVoiceResponse(BaseModel):
    items: list[str]                 # Extracted tags
    structured: dict | None = None   # For goals: {event, location, date, target_time}
```

**System Prompts:**

Sport step:
```
Extract sport/activity names from the user's German text.
Return JSON: {"items": ["Sport1", "Sport2"]}
Only include recognized sports/activities. Keep names in German.
```

Goals step:
```
Extract fitness goals from the user's German text.
Return JSON: {
  "items": ["Goal tag 1", "Goal tag 2"],
  "structured": {
    "event": "Halbmarathon",
    "location": "Karlsruhe",
    "date": "September",
    "target_time": "unter 1:30h"
  }
}
Keep all text in German. structured is optional, only for race goals.
```

---

## 7. Health Integration

### Platform Matrix

| Platform | Primary | Secondary |
|----------|---------|-----------|
| iOS | Apple Health (`useAppleHealth`) | Garmin Connect |
| Android | Health Connect (`useHealthConnect`) | Garmin Connect |

### Connection Flow During Onboarding

**Apple Health (iOS):**
1. User taps "Verbinden"
2. `useAppleHealth.connect()` requests HealthKit permissions
3. Green checkmark shown on success
4. Actual data sync happens after account creation

**Health Connect (Android):**
1. User taps "Verbinden"
2. `useHealthConnect.connect()` requests Health Connect permissions
3. Green checkmark shown on success
4. Actual data sync happens after account creation

**Garmin Connect:**
1. User taps "Verbinden"
2. `GarminConnectModal` opens (existing component)
3. User enters Garmin email + password
4. Credentials stored in `onboardingStore.garminCredentials` (memory only)
5. Green checkmark shown
6. Actual `POST /garmin/connect` happens after account creation (requires auth)

### Post-Account-Creation Sync

After `supabase.auth.signUp()` succeeds:
1. If `garminCredentials` set: `POST /garmin/connect` with stored email/password
2. If Apple Health connected: `appleHealth.sync()` to push data to backend
3. If Health Connect connected: `healthConnect.sync()` to push data to backend

---

## 8. Backend Endpoints

### POST /api/onboarding/setup

**Auth:** Required (Supabase JWT)
**File:** `athletly-backend/src/api/routers/onboarding.py`

```python
class OnboardingSetupRequest(BaseModel):
    sports: list[str]
    custom_sport: str | None = None
    goals: list[str]
    custom_goal: str | None = None
    available_days: list[str]   # ["mon", "tue", "wed", ...]
    wearable: str | None = None # "garmin" | "apple_health" | "health_connect"

# Response
class OnboardingSetupResponse(BaseModel):
    status: str     # "ok"
    message: str    # "Setup gespeichert"
```

**Logic:**
1. Update `profiles` table: `sports`, `goal` (JSONB), `meta.available_days`
2. Trigger background agent session (`context="onboarding"`) that:
   - Reads profile data
   - Creates session schemas, metrics, evaluation criteria
   - Creates and saves initial training plan
   - Calls `complete_onboarding()` tool (sets `onboarding_complete = true`)
3. Return immediately (agent runs async in background)
4. User lands on `/(tabs)`, coach greets with plan when ready

### POST /api/onboarding/parse-voice

**Auth:** None (public)
**Rate Limit:** 10 per IP per hour (slowapi)
**File:** `athletly-backend/src/api/routers/onboarding.py`

See [Section 6: Voice Input & AI Parsing](#6-voice-input--ai-parsing) for details.

---

## 9. Auth Guard Changes

### Current Guard (`app/_layout.tsx`)

```
!session           --> /(auth)/login
session + !onboard --> /(onboarding)
session + onboard  --> /(tabs)
```

### New Guard

```
!session           --> /(onboarding)          <-- Welcome screen (not login!)
session + !onboard --> /(tabs)                <-- Agent working in background
session + onboard  --> /(tabs)                <-- Normal state
```

The welcome screen handles the fork:
- "Lass uns loslegen" starts companion flow (no auth needed)
- "Ich habe bereits einen Account" navigates to `/(auth)/login`

After login, auth guard checks `isOnboarded`:
- If true: `/(tabs)`
- If false: `/(tabs)` (existing user, agent re-triggers if needed)

---

## 10. File Structure

### New Files

```
app/(onboarding)/
  _layout.tsx              <-- Stack + ProgressDots + Back nav
  index.tsx                <-- Welcome (replaces old chat onboarding)
  sport.tsx                <-- Step 1: Sport selection
  goals.tsx                <-- Step 2: Goals
  schedule.tsx             <-- Step 3: Available days
  health.tsx               <-- Step 4: Health connection
  summary.tsx              <-- Step 5: Summary
  create-account.tsx       <-- Step 6: Sign up

components/onboarding/
  CompanionCard.tsx
  ProgressDots.tsx
  SelectableTile.tsx
  DayPicker.tsx
  VoiceTextInput.tsx
  ParsedTags.tsx

store/
  onboardingStore.ts       <-- Complete rewrite (no chat)
```

### Backend New Files

```
athletly-backend/src/api/routers/
  onboarding.py            <-- /onboarding/setup + /onboarding/parse-voice
```

### Modified Files

```
app/_layout.tsx            <-- Auth guard changes
app/(onboarding)/_layout.tsx  <-- Progress dots, back nav
athletly-backend/src/api/main.py  <-- Register onboarding router
```

### Deleted / Cleaned Up

```
# Old chat onboarding references removed from:
hooks/useChatStream.ts     <-- Remove 'onboarding' context handling
types/chat.ts              <-- Remove ChatContext 'onboarding' if unused
```

---

## 11. Runna Comparison

| Aspect | Runna | Athletly |
|--------|-------|---------|
| Screens | 26-30, ~12 min | 7, ~3-4 min |
| Style | Quiz-style, dark theme | Companion cards, light theme |
| Account timing | Account first | Account last (better conversion) |
| Sports | Running only | Multi-sport |
| Goals | Predefined distances + race DB search | Tiles + free-text/voice for specific goals |
| Training days | Day picker (Mo-So) + long run day | Day picker (Mo-So), coach decides rest |
| Wearables | Not in onboarding | Apple Health / Health Connect / Garmin directly |
| Voice input | None | Voice-first with AI parsing |
| AI feedback | None in onboarding | Real-time voice-to-tags |
| Summary | Pre-paywall value summary | Companion summary before account |
| Progress | No indicator | Progress dots |
| Paywall | Soft paywall after summary | No paywall |

### Where Athletly is stronger
- Account last = higher conversion
- Voice input + AI parsing = unique differentiator
- Multi-sport support
- Wearable connection directly in onboarding
- Shorter flow = less drop-off risk

### What Runna has that we skip (intentionally)
- Fitness level self-assessment (coach determines this from data + conversation)
- Long run day preference (coach decides optimal schedule)
- Benchmark time (coach asks this in first conversation if relevant)
- Coach introduction video (AI coach introduces itself in first chat)
