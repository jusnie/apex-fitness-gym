# Athletly Design System v2 — Inspired by HubFit

> Comprehensive design specification for the Athletly app redesign.
> Based on detailed visual analysis of HubFit's UI/UX patterns, adapted for Athletly's fitness coaching context.
>
> Related: [Companion Onboarding](./companion-onboarding.md)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Card System](#5-card-system)
6. [Header Gradient](#6-header-gradient)
7. [Buttons](#7-buttons)
8. [Inputs & Form Elements](#8-inputs--form-elements)
9. [Progress Indicators](#9-progress-indicators)
10. [Bottom Tab Bar](#10-bottom-tab-bar)
11. [Lists & List Items](#11-lists--list-items)
12. [Badges & Tags](#12-badges--tags)
13. [Charts & Data Visualization](#13-charts--data-visualization)
14. [Modals & Bottom Sheets](#14-modals--bottom-sheets)
15. [Notifications & Alerts](#15-notifications--alerts)
16. [Segmented Controls](#16-segmented-controls)
17. [Shadows & Elevation](#17-shadows--elevation)
18. [Icons](#18-icons)
19. [Screen Patterns](#19-screen-patterns)
20. [Migration from Current Dark Theme](#20-migration-from-current-dark-theme)

---

## 1. Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Light & Airy** | Light mode with bright whites, soft grays, and generous whitespace. No dark mode (contrast to current app). |
| **Gradient Personality** | A striking blue-to-indigo gradient header gives each screen a premium, branded feel. |
| **Card-First Layout** | All content lives inside floating white cards on a light gray canvas. Cards create visual depth through subtle shadows. |
| **Soft & Rounded** | Large border-radius values (16-20px) on all cards, buttons, and containers. The UI feels approachable and modern. |
| **Blue Accent Dominance** | Royal blue is the single primary accent. All interactive elements, progress indicators, and highlights use this blue. |
| **Clean Data Display** | Metrics are presented in circular gauges, mini stat cards, and clean line charts. Data is always scannable. |

### What Changes from Current Design

| Current (Dark) | New (Light/HubFit-inspired) |
|---|---|
| OLED black background (#09090B) | Soft gray canvas (#F0F2F5) |
| Dark zinc cards (#18181B) | Pure white cards (#FFFFFF) |
| Blue-500 accent (#3B82F6) | Royal blue accent (#2563EB) |
| Zinc borders | Borderless cards with shadows |
| Flat layout | Gradient header + floating cards |
| Minimal shadows | Layered elevation system |

---

## 2. Color System

### Primary Palette

```
background:        #F0F2F5    // Soft gray canvas — the base layer
surface:           #FFFFFF    // Pure white — all cards and containers
surfaceNested:     #F5F6F8    // Light warm gray — stat cards nested inside white cards
surfaceMuted:      #E8EBF0    // Slightly darker gray — inactive/disabled surfaces
```

### Accent Colors

```
primary:           #2563EB    // Royal blue — main accent, links, active states
primaryDark:       #1D4ED8    // Deeper blue — pressed states, emphasis
primaryLight:      #DBEAFE    // Very light blue — tags, soft highlights, success banners
primaryUltraLight: #EFF6FF    // Barely blue tint — subtle backgrounds
```

### Gradient (Header)

```
gradientStart:     #2563EB    // Royal blue (top-left)
gradientMid:       #4F46E5    // Indigo (middle, optional)
gradientEnd:       #7C3AED    // Violet/purple (bottom-right)
```

The gradient flows from **top-left blue to bottom-right purple**, creating a diagonal wash across the header area. It extends approximately **25-30%** down from the top of the screen.

### Text Colors

```
textPrimary:       #0F172A    // Near-black — headings, primary text
textSecondary:     #475569    // Slate gray — subtitles, descriptions
textMuted:         #94A3B8    // Light slate — timestamps, placeholders, hints
textOnGradient:    #FFFFFF    // Pure white — text on the gradient header
textAccent:        #2563EB    // Blue — links, highlighted values, active labels
```

### Status Colors

```
success:           #22C55E    // Green — completed, goal hit
successLight:      #DCFCE7    // Light green bg
warning:           #F59E0B    // Amber — caution states
warningLight:      #FEF3C7    // Light amber bg
error:             #EF4444    // Red — errors, destructive
errorLight:        #FEE2E2    // Light red bg
info:              #2563EB    // Blue — same as primary (informational)
infoLight:         #DBEAFE    // Light blue bg
```

### Semantic Surfaces

```
cardBg:            #FFFFFF    // Card background
cardBorder:        transparent // Cards have NO visible border — shadows create separation
inputBg:           #FFFFFF    // Input fields
inputBorder:       #E2E8F0    // Subtle gray border for inputs
inputFocusBorder:  #2563EB    // Blue focus ring
divider:           #E2E8F0    // Thin horizontal rules inside cards
overlay:           rgba(0, 0, 0, 0.4)  // Modal backdrop
tabActive:         #2563EB    // Active tab icon
tabInactive:       #94A3B8    // Inactive tab icon
```

### Macro/Nutrition Colors (from HubFit nutrition screen)

```
carb:              #C084FC    // Purple — carbohydrate progress bar
protein:           #2563EB    // Blue — protein progress bar
fat:               #5EEAD4    // Teal/cyan — fat progress bar
```

---

## 3. Typography

### Font Family

**Primary:** Inter (same as HubFit)
**Fallback:** System font stack

HubFit uses Inter across all weights. We adopt the same.

### Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display` | 32px | 700 (Bold) | 38px | -0.5px | Hero metrics ("1360", "10000") |
| `h1` | 26px | 700 (Bold) | 32px | -0.3px | Screen titles, greeting ("Hello Arnold") |
| `h2` | 20px | 600 (Semibold) | 26px | 0 | Section headers ("History", "Activity") |
| `h3` | 17px | 600 (Semibold) | 22px | 0 | Card titles ("Daily Steps", "Goal") |
| `body` | 15px | 400 (Regular) | 22px | 0 | Body text, descriptions |
| `bodyMedium` | 15px | 500 (Medium) | 22px | 0 | List item labels, tab labels |
| `bodySm` | 13px | 400 (Regular) | 18px | 0 | Subtitles, secondary info |
| `caption` | 11px | 500 (Medium) | 15px | 0.3px | Timestamps, category labels, uppercase labels |
| `captionUpper` | 11px | 700 (Bold) | 15px | 0.8px | Uppercase section labels ("TASKS", "HABITS", "CHECK-IN") |
| `metric` | 36px | 700 (Bold) | 42px | -0.5px | Large stat numbers ("36%", "5 Days") |
| `metricSm` | 24px | 700 (Bold) | 30px | -0.3px | Smaller metrics ("71%", "1360") |

### Key Typographic Patterns from HubFit

- **Greeting:** h1 bold, white on gradient
- **Motivational subtitle:** body italic, white on gradient, slightly translucent
- **Section headers with icons:** emoji/icon + h2 semibold ("History", "Activity")
- **Uppercase category labels:** captionUpper, blue or dark, with tracking ("TASKS", "HABITS")
- **Stat + unit pairs:** metric bold + body regular on same baseline ("36 %", "5 Days")
- **Timestamps:** caption, textMuted, right-aligned ("Now", "3m", "5m")

---

## 4. Spacing & Layout

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Micro spacing, icon-to-text gap |
| `sm` | 8px | Tight inner spacing |
| `md` | 12px | Inner card gaps between elements |
| `lg` | 16px | Standard padding, card-to-card gap |
| `xl` | 20px | Hero card inner padding |
| `2xl` | 24px | Section spacing |
| `3xl` | 32px | Major section breaks |

### Screen Layout

```
Screen horizontal padding:    16px (lg)
Card-to-card vertical gap:    12px (md)
Section-to-section gap:       24px (2xl)
Card inner padding:           16px (lg) for standard, 20px (xl) for hero
Nested stat card padding:     16px (lg)
Header gradient height:       ~200-240px (extends ~30% of screen)
Content overlap into header:  Cards start overlapping the gradient ~60px from gradient bottom
```

### Screen Structure (top to bottom)

```
+--[ Status Bar ]--+
|                  |
|  [ GRADIENT ]    |  <- Blue-to-purple gradient background
|  Greeting Text   |  <- White text on gradient
|  Subtitle        |
|       +----------+--+
|       | Card 1      |  <- White cards float above gradient edge
+-------+             |
        |             |
        +-------------+
    [ Card 2 ]           <- Cards on light gray canvas
    [ Card 3 ]
    ...
+--[ Tab Bar ]-----+
```

---

## 5. Card System

### Card Variants

#### Standard Card
The **primary container** for all content sections.

```
background:     #FFFFFF
borderRadius:   16px
padding:        16px
shadow:         0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)
border:         none
marginH:        16px (screen padding)
```

#### Hero Card
Used for the **greeting/header section** that overlaps the gradient.

```
background:     #FFFFFF
borderRadius:   20px
padding:        20px
shadow:         0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)
border:         none
marginH:        16px
```

This card sits **partially inside the gradient zone** and partially below it, creating a floating effect.

#### Stat Card (Nested)
Used **inside** other cards for individual metrics (e.g., "5 Days", "71%").

```
background:     #F5F6F8
borderRadius:   14px
padding:        16px
shadow:         none
border:         none
```

These have a **light gray background** that contrasts with the parent white card.

#### Glass/Overlay Card
Used for **banners or success messages** inside cards.

```
background:     #DBEAFE (primaryLight) or #EFF6FF (primaryUltraLight)
borderRadius:   12px
padding:        12px 16px
shadow:         none
border:         none
```

Example: The "Amazing! You've hit your goal." banner uses this style — a light blue/cyan tinted background.

### Card Layout Patterns

**Section card with divider:**
```
+---------------------------------+
| [icon] Title          [action]  |
|---------------------------------| <- thin divider line (#E2E8F0)
|                                 |
|  Content / List Items           |
|                                 |
+---------------------------------+
```

**Two-column stat grid:**
```
+---------------------------------+
| [icon] Section Title            |
|---------------------------------|
| +------------+ +------------+   |
| | [icon]     | | [icon]     |   |
| | 5 Days     | | 71 %       |   |
| | Label      | | Label      |   |
| +------------+ +------------+   |
+---------------------------------+
```

---

## 6. Header Gradient

The gradient header is the **signature design element**. It provides a premium, branded feel.

### Specification

```
type:           LinearGradient
direction:      top-left (0,0) → bottom-right (1,1)  OR  top (0,0) → bottom (0,1)
colors:         ['#2563EB', '#4F46E5', '#7C3AED']
stops:          [0, 0.5, 1]
height:         ~220px (absolute) or ~28% of screen
```

### Content on Gradient

- **App logo / title:** Top-left, white
- **Action icons:** Top-right (notification bell, messages), white
- **Greeting:** "Hello Arnold," — h1 bold white
- **Subtitle:** Motivational text — body regular white, slightly translucent
- **Progress ring:** Top-right of content area, circular gauge showing % (e.g. "50%")

### Transition to Content

Cards begin **inside the gradient zone** (approximately 60px overlap). The first card (hero card) has a stronger shadow to stand out against the gradient. Below the gradient, the `#F0F2F5` canvas takes over.

### Implementation Note (React Native)

```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#2563EB', '#4F46E5', '#7C3AED']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ height: 220, position: 'absolute', top: 0, left: 0, right: 0 }}
/>
```

Cards use `marginTop: -60` (negative) or absolute positioning to overlap.

---

## 7. Buttons

### Primary Button (CTA)

The main CTA button is a **dark/black rounded pill** — not blue. This is a distinctive HubFit pattern.

```
background:     #1E293B (very dark slate) or #0F172A (near black)
borderRadius:   14px (large pill)
height:         52px
paddingH:       24px
textColor:      #FFFFFF
fontSize:       16px
fontWeight:     600 (Semibold)
shadow:         0 2px 8px rgba(0, 0, 0, 0.12)
```

### Secondary Button

```
background:     #FFFFFF
borderRadius:   14px
height:         48px
paddingH:       20px
textColor:      #0F172A
fontSize:       15px
fontWeight:     500 (Medium)
border:         1px solid #E2E8F0
shadow:         none
```

### Ghost / Text Button

```
background:     transparent
textColor:      #2563EB
fontSize:       15px
fontWeight:     500 (Medium)
```

### Icon Button

Small circular or rounded-square buttons used for actions (+, edit, close, etc.).

```
background:     #F5F6F8
borderRadius:   12px
size:           40x40px
iconColor:      #475569
iconSize:       20px
border:         1px solid #E2E8F0
shadow:         none
```

**Variant — on gradient:**
```
background:     rgba(255, 255, 255, 0.2)
borderRadius:   12px
size:           40x40px
iconColor:      #FFFFFF
border:         none
```

### Destructive Button

```
background:     #FEE2E2
borderRadius:   14px
textColor:      #EF4444
fontWeight:     600
```

---

## 8. Inputs & Form Elements

### Text Input

```
background:     #FFFFFF
borderRadius:   14px
height:         52px
paddingH:       16px
border:         1px solid #E2E8F0
focusBorder:    2px solid #2563EB
fontSize:       15px
textColor:      #0F172A
placeholderColor: #94A3B8
```

### Message Input (Chat)

```
background:     #F5F6F8
borderRadius:   24px (full pill)
height:         44px
paddingH:       16px
paddingLeft:    48px (avatar space)
border:         none
placeholderColor: #94A3B8
sendButtonBg:   #2563EB
sendButtonRadius: 20px (circle)
```

### Search Input

```
background:     #F5F6F8
borderRadius:   14px
height:         44px
paddingH:       16px
paddingLeft:    44px (search icon)
border:         none
iconColor:      #94A3B8
```

---

## 9. Progress Indicators

### Large Circular Gauge (Hero)

Used for the main completion metric (e.g., "50%" on dashboard, "36% completion rate").

```
diameter:       140px
strokeWidth:    10px
trackColor:     #E2E8F0 (light gray)
progressColor:  #2563EB (royal blue)
lineCap:        round
centerText:     metric font (36px bold)
centerSubtext:  bodySm (#94A3B8)
rotation:       -90deg (starts from top)
```

### Medium Circular Gauge

Used for the nutrition calorie tracker and step counter.

```
diameter:       100px
strokeWidth:    8px
trackColor:     #E8EBF0
progressColor:  #2563EB
centerText:     metricSm (24px bold)
```

### Small Circular Gauge (Avatar-sized)

Used inline next to habit items.

```
diameter:       44px
strokeWidth:    3px
trackColor:     #E2E8F0
progressColor:  #2563EB
```

### Linear Progress Bar

Used for macro nutrients (carbs, protein, fat).

```
height:         6px
borderRadius:   3px (full)
trackColor:     #E8EBF0
barColors:      varies per macro (see Macro Colors in section 2)
```

### Dot Indicators (Monthly Activity)

```
filledColor:    #2563EB
emptyColor:     #E2E8F0
size:           8px
gap:            4px
shape:          circle
```

---

## 10. Bottom Tab Bar

### Structure

5 tabs, icon-only (no labels visible in HubFit), with avatar for profile.

```
background:     #FFFFFF
height:         84px (including safe area)
borderTop:      none (clean, no border)
shadow:         0 -1px 4px rgba(0, 0, 0, 0.04) (very subtle top shadow)
paddingBottom:  safeArea
```

### Tab Items

```
iconSize:       24px
activeColor:    #2563EB
inactiveColor:  #94A3B8
```

### Athletly Tab Mapping

| Tab | Icon | Label (optional) |
|-----|------|-------------------|
| Home | Home (house) | Today |
| Training | Dumbbell / Sliders | Plan |
| Coach | MessageCircle | Coach |
| Check-in | Target / Crosshair | Tracking |
| Profile | User avatar (circle) | Profil |

The profile tab uses a **small circular avatar image** (28px) instead of a generic icon — a nice personal touch from HubFit.

---

## 11. Lists & List Items

### Standard List Item

Used for habits, tasks, notifications, vault items.

```
height:         auto (min 52px)
paddingV:       12px
paddingH:       0 (inherits from card)
divider:        1px solid #F0F2F5 (between items, NOT after last)
```

**Layout:**
```
[Icon/Avatar 40px]  [16px gap]  [Title + Subtitle (flex)]  [Action/Value]
```

### Habit List Item

```
+-----------------------------------------------------+
| [CircularProgress 44px]  Daily Steps       [+ btn]   |
|                          10000/10000 STEPS            |
+-----------------------------------------------------+
```

- Icon: Small circular progress ring (44px) with category icon inside
- Title: h3 semibold, textPrimary
- Subtitle: bodySm, textMuted, uppercase tracking
- Action: Icon button (40x40, #F5F6F8 bg)

### Notification List Item

```
+-----------------------------------------------------+
| [Emoji 28px]  [12px]  Description with **bold**  3m  |
+-----------------------------------------------------+
```

- Leading: Emoji or small icon
- Description: bodySm, textSecondary, with `<b>` segments in textPrimary
- Timestamp: caption, textMuted, right-aligned

---

## 12. Badges & Tags

### Status Badge (Pill)

Used for "Starts on Aug 2", "1/2 Completed", etc.

```
background:     transparent
borderRadius:   8px
paddingV:       4px
paddingH:       10px
border:         1px solid #2563EB (blue outline)
textColor:      #2563EB
fontSize:       11px
fontWeight:     600
```

### Completion Badge

```
background:     #DBEAFE
borderRadius:   8px
paddingV:       4px
paddingH:       10px
textColor:      #2563EB
fontSize:       12px
fontWeight:     600
border:         none
```

### Streak Badge

```
[fire icon] 2
iconColor:      #F59E0B (amber)
textColor:      #F59E0B
fontSize:       14px
fontWeight:     600
```

---

## 13. Charts & Data Visualization

### Line Chart (History)

Used for the Daily Steps history.

```
lineColor:      #2563EB
lineWidth:      3px
lineCap:        round
lineJoin:       round
smooth:         true (bezier curves)
dotSize:        0 (no visible dots on data points)
gridLines:      horizontal only, #F0F2F5
axisLabelColor: #94A3B8
axisLabelSize:  11px
areaFill:       none (line only, no fill underneath)
```

### Monthly Activity Heatmap

A horizontal row of dots representing daily completion.

```
layout:         single row, left to right
dotSize:        8px
dotSpacing:     4px
filledColor:    #2563EB
emptyColor:     #E2E8F0
halfColor:      #93C5FD (partial completion, lighter blue)
```

---

## 14. Modals & Bottom Sheets

### Bottom Sheet

Used for "Vault", "Daily Steps" quick view.

```
background:     #FFFFFF
borderRadius:   24px 24px 0 0 (top corners only)
shadow:         0 -4px 20px rgba(0, 0, 0, 0.1)
paddingTop:     24px
paddingH:       20px
handleBar:      40px wide, 4px tall, #E2E8F0, centered, 8px from top
```

### Full-Screen Modal

```
background:     #F0F2F5
borderRadius:   0
closeButton:    top-right, 32px circle, #F5F6F8 bg, X icon
titleAlign:     center
```

---

## 15. Notifications & Alerts

### Success Banner (In-Card)

The "Amazing! You've hit your goal." pattern.

```
background:     #DBEAFE or linear-gradient(#EFF6FF, #DBEAFE)
borderRadius:   12px
paddingV:       12px
paddingH:       16px
textColor:      #2563EB
fontSize:       14px
fontWeight:     500
textAlign:      center
border:         1px solid #BFDBFE (very subtle blue border)
```

### Toast Notification

```
background:     #0F172A (dark)
borderRadius:   14px
paddingV:       14px
paddingH:       16px
textColor:      #FFFFFF
shadow:         0 8px 24px rgba(0, 0, 0, 0.16)
position:       bottom, 16px from tab bar
```

---

## 16. Segmented Controls

Used for "Log Food" / "Meal Plans" toggle.

```
containerBg:    #FFFFFF
containerRadius: 14px
containerBorder: 1px solid #E2E8F0
containerHeight: 48px
containerPadding: 4px

activeSegmentBg:     #FFFFFF (or slight shadow to stand out)
activeSegmentRadius: 12px
activeSegmentShadow: 0 1px 3px rgba(0, 0, 0, 0.08)
activeTextColor:     #2563EB
activeTextWeight:    600

inactiveTextColor:   #94A3B8
inactiveTextWeight:  500
```

The active segment appears **slightly elevated** with a subtle shadow, while the inactive segment is flat.

---

## 17. Shadows & Elevation

HubFit uses a **very restrained shadow system**. Cards appear to float, but the shadows are subtle — never harsh.

| Level | Shadow | Usage |
|-------|--------|-------|
| `elevation-0` | none | Nested stat cards, inner elements |
| `elevation-1` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Standard cards |
| `elevation-2` | `0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)` | Hero cards, floating above gradient |
| `elevation-3` | `0 8px 24px rgba(0,0,0,0.12)` | Modals, bottom sheets |
| `elevation-tab` | `0 -1px 4px rgba(0,0,0,0.04)` | Tab bar top shadow |

### Key Principle

Cards use **shadow instead of borders** for separation. There are **no visible borders on cards** — only shadows create the sense of depth and layering.

---

## 18. Icons

### Style

- **Library:** Lucide React Native (consistent with current app)
- **Stroke width:** 1.5px (thinner than current 2px — feels more refined)
- **Size system:** 20px (inline), 24px (tabs, actions), 28px (headers)

### Icon Circles

Many icons in HubFit sit inside colored circles:

```
containerSize:  40px
containerRadius: 12px (rounded square) or 20px (circle)
containerBg:    #EFF6FF (blue tint) or #F5F6F8 (neutral gray)
iconColor:      #2563EB (on blue bg) or #475569 (on gray bg)
iconSize:       20px
```

### Category Icon Patterns

| Category | Icon BG | Icon Color |
|----------|---------|------------|
| Habits | #EFF6FF | #2563EB |
| Tasks | #F0FDF4 | #22C55E |
| Check-in | #FFF7ED | #F59E0B |
| Community | #FDF2F8 | #EC4899 |
| Training | #F5F3FF | #7C3AED |

---

## 19. Screen Patterns

### Dashboard (Home) Screen

```
+---[ Gradient Header ]---+
| Logo        [bell] [msg]|
| Hello {name},           |
| Motivational text       |  [50% ring]
|                         |
|  +---[ Hero Card ]----+ |
|  | TASKS    1/2 Done   | |
|  |                     | |
+--| HABITS              |-+
   | - Daily Steps  [+]  |
   | CHECK-IN             |
   | - Daily Check-In [>] |
   +---------------------+

   +---[ Community ]------+
   | Community             |
   | [img] [img]           |
   | Label  Label          |
   +----------------------+

+------[ Tab Bar ]--------+
```

### Detail Screen (e.g., Daily Steps)

```
+---[ Gradient Header ]---+
| [<-]  Daily Steps       |
|                         |
+--+---[ Goal Card ]---+--+
   | Goal  10000/DAY [e]|
   | [ring] Daily Steps  |
   | [success banner]   |
   +--------------------+

   +---[ History Card ]--+
   | History        [cal]|
   |---------------------|
   | [line chart]        |
   +--------------------+

   +---[ Activity Card ]-+
   | Activity             |
   |---------------------|
   | [5 Days] [71%]      |
   | [streak] [best]     |
   +--------------------+

+------[ Tab Bar ]--------+
```

### Nutrition Screen

```
+---[ Gradient Header ]---+
|                         |
| [Log Food | Meal Plans] | <- Segmented control on gradient
|                         |
+--+---[ Tracker Card ]-+-+
   | [<] Today [>]   [...] |
   |                       |
   | 640     [1360]   2000 |
   | eaten    left    goal |
   |                       |
   | carb   protein   fat  |
   | [===]  [====]  [===]  |
   +-----------------------+
```

---

## 20. Migration from Current Dark Theme

### Files to Update

| File | Change |
|------|--------|
| `lib/colors.ts` | Complete rewrite — dark zinc palette to light blue palette |
| `lib/typography.ts` | Adjust sizes slightly, add new tokens |
| `global.css` | Add Tailwind color extensions |
| `tailwind.config.js` | Update custom colors, add shadow utilities |
| `components/ui/Card.tsx` | Remove border, add shadow, white bg, increase radius |
| `components/ui/Button.tsx` | Dark CTA style, update all variant colors |
| `components/ui/Input.tsx` | Light bg, subtle border, blue focus |
| `components/ui/Badge.tsx` | Blue outline/fill styles |
| `components/ui/ProgressBar.tsx` | Gray track, blue fill |
| `components/ui/CircularGauge.tsx` | Gray track, blue progress |
| `app/(tabs)/_layout.tsx` | White tab bar, no border, subtle shadow |
| `app/(tabs)/index.tsx` | Add gradient header, restructure layout |
| All screen files | Update bg-background, text colors, card usage |

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `GradientHeader` | Reusable gradient header with greeting, actions, and overlap zone |
| `SegmentedControl` | Tab switcher (Log Food / Meal Plans style) |
| `StatCard` | Nested gray metric card with icon, value, label |
| `SuccessBanner` | Light blue celebration/info banner |
| `DotHeatmap` | Monthly activity dot visualization |
| `AvatarTabIcon` | Circular user avatar for profile tab |

### Tailwind Color Config

```js
// tailwind.config.js — colors extension
{
  background: '#F0F2F5',
  surface: '#FFFFFF',
  'surface-nested': '#F5F6F8',
  'surface-muted': '#E8EBF0',
  primary: '#2563EB',
  'primary-dark': '#1D4ED8',
  'primary-light': '#DBEAFE',
  'primary-ultra-light': '#EFF6FF',
  'text-primary': '#0F172A',
  'text-secondary': '#475569',
  'text-muted': '#94A3B8',
  divider: '#E2E8F0',
  success: '#22C55E',
  'success-light': '#DCFCE7',
  warning: '#F59E0B',
  'warning-light': '#FEF3C7',
  error: '#EF4444',
  'error-light': '#FEE2E2',
}
```

---

## Appendix: Color Comparison (Before vs After)

| Token | Current (Dark) | New (Light) |
|-------|---------------|-------------|
| background | `#09090B` | `#F0F2F5` |
| surface | `#18181B` | `#FFFFFF` |
| surfaceElevated | `#27272A` | `#F5F6F8` |
| border | `#3F3F46` | transparent (shadows) |
| primary | `#3B82F6` | `#2563EB` |
| success | `#34D399` | `#22C55E` |
| warning | `#FBBF24` | `#F59E0B` |
| error | `#F87171` | `#EF4444` |
| textPrimary | `#FAFAFA` | `#0F172A` |
| textSecondary | `#A1A1AA` | `#475569` |
| textMuted | `#71717A` | `#94A3B8` |
| cardBg | `#18181B` | `#FFFFFF` |
| cardBorder | `#27272A` | transparent |
| tabActive | `#3B82F6` | `#2563EB` |
| tabInactive | `#71717A` | `#94A3B8` |

---

## Appendix: Design Tokens JSON

For programmatic usage / export:

```json
{
  "colors": {
    "background": "#F0F2F5",
    "surface": "#FFFFFF",
    "surfaceNested": "#F5F6F8",
    "surfaceMuted": "#E8EBF0",
    "primary": "#2563EB",
    "primaryDark": "#1D4ED8",
    "primaryLight": "#DBEAFE",
    "primaryUltraLight": "#EFF6FF",
    "gradientStart": "#2563EB",
    "gradientMid": "#4F46E5",
    "gradientEnd": "#7C3AED",
    "textPrimary": "#0F172A",
    "textSecondary": "#475569",
    "textMuted": "#94A3B8",
    "textOnGradient": "#FFFFFF",
    "textAccent": "#2563EB",
    "success": "#22C55E",
    "successLight": "#DCFCE7",
    "warning": "#F59E0B",
    "warningLight": "#FEF3C7",
    "error": "#EF4444",
    "errorLight": "#FEE2E2",
    "divider": "#E2E8F0",
    "overlay": "rgba(0,0,0,0.4)",
    "tabActive": "#2563EB",
    "tabInactive": "#94A3B8"
  },
  "shadows": {
    "elevation1": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    "elevation2": "0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
    "elevation3": "0 8px 24px rgba(0,0,0,0.12)",
    "elevationTab": "0 -1px 4px rgba(0,0,0,0.04)"
  },
  "radii": {
    "sm": 8,
    "md": 12,
    "lg": 14,
    "xl": 16,
    "2xl": 20,
    "full": 9999
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 20,
    "2xl": 24,
    "3xl": 32
  }
}
```
