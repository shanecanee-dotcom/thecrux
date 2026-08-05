# CRUX — Climbing Tracker

A mobile-first PWA for tracking climbing sessions, hangboard training, and progress. Built as a single HTML file with no build step.

## Tech Stack

- **React 18** via CDN (UMD build, no JSX compilation step)
- **Babel Standalone** transpiles JSX in the browser at runtime
- **Supabase** for auth and data persistence
- **Service Worker** for offline/PWA support
- Google Fonts: DM Sans + DM Mono

## File Structure

```
index.html              # Entry point — loads all scripts in order
sw.js                   # Service worker (cache-first + background refresh)
manifest.json           # PWA manifest
icon.svg                # App icon
project/
  crux-data.jsx         # Constants, utils, themes, icons, computeDerived
  crux-supabase.jsx     # Supabase client, sync logic
  crux-auth.jsx         # Auth screens (sign in / sign up)
  crux-ui.jsx           # Shared UI components (Label, RestTimer, GradeSelector, AddClimbModal, ClimbCard, ClimbDetailModal, ExerciseCard)
  crux-screens.jsx      # Main screens (Session, History, Stats) + Ring, ProgressChart, ActivityHeatmap, PersonalRecords, AchievementToast
  crux-training.jsx     # Training screen + WarmUpOverlay + HangTimerOverlay
  crux-profile.jsx      # Profile/settings screen
  crux-app.jsx          # Root app, nav, state orchestration, achievement detection
```

**Load order matters** — each file depends on globals set by earlier files. Never reorder the script tags in `index.html`.

## How Globals Work

There is no module system. Each file exposes its exports via:

```js
Object.assign(window, { ComponentA, ComponentB, CONSTANT });
```

Later files reference these as bare globals (e.g. `THEMES`, `Icon`, `computeDerived`). When adding a new component used by a later-loading file, make sure it's exported from a file that loads first.

## Data Model

All session data lives in Supabase table `sessions`:
```
id        text PRIMARY KEY
user_id   uuid (references auth.users)
data      jsonb
```

The `data` jsonb field holds the full session object. Three session types share the same table:

```js
// Climbing session
{ id, type:'indoor'|'outdoor', startTime, endTime, gym, climbs: [...], notes?, sector?, rockType?, conditions? }

// Training session
{ id, type:'training', startTime, endTime, exercises: [...] }

// Climb object
{ id, outcome:'sent'|'flash'|'attempt', grade?:{system:'v'|'font', grade:string}, wallType?, holdColor?, attempts?, notes? }

// Exercise (hangboard set)
{ id, edgeSize, gripType, hangTime, restTime, sets, weight, notes?, time }
```

## State Architecture (crux-app.jsx)

- `sessions` — array of all completed sessions, newest first
- `currentSession` — the in-progress session (climbing OR training, never both)
- `setSessions` — wrapper that writes to localStorage AND syncs to Supabase
- `deletedIdsRef` — `useRef(Set)` that prevents sync from resurrecting deleted sessions
- `toastQueue` — array of earned achievements pending display
- `earnedAchRef` — `useRef(Set)` initialised silently on mount to avoid re-notifying on reload

Mutual exclusion between session types is enforced by conflict views in both `SessionScreen` and `TrainingScreen` — if one type is active, the other shows a "go to X" prompt.

## Theming

Three themes defined in `crux-data.jsx` → `THEMES`:
- `pure` — light, minimal, black accent
- `stone` — warm earth tones, brown accent
- `night` — dark mode, neon yellow-green (`#C8FF00`) accent

Every component receives `tweaks` prop and does `const th = THEMES[tweaks.theme]`. Use `th.accent`, `th.text`, `th.card`, etc. — never hardcode colours. For semi-transparent accent overlays, append 2-digit hex alpha: `th.accent + '55'` (8-digit hex, supported in all modern browsers).

Key theme tokens: `bg`, `surface`, `card`, `border`, `borderStrong`, `text`, `textSub`, `textMuted`, `accent`, `accentText`, `accentSoft`, `accentSoftText`, `success`, `successBg`, `danger`, `dangerBg`, `warning`, `warningBg`, `shadow`, `shadowMd`, `radius`, `radiusSm`, `radiusLg`.

## Modal Pattern

Bottom-sheet modals use the `.sheet-wrap` / `.sheet` CSS classes defined in `index.html`. On mobile they slide up from the bottom; on desktop (≥720px) they appear as centred cards.

```jsx
<div className="sheet-wrap" onClick={onClose}>
  <div className="sheet scroll" style={{ background:th.bg }} onClick={e => e.stopPropagation()}>
    {/* content */}
  </div>
</div>
```

## Key Constants (crux-data.jsx)

```js
V_GRADES     // ['VB','V0',...,'V12']
FONT_GRADES  // ['4','5',...,'8C']
WALL_TYPES, HOLD_COLORS, ROCK_TYPES, CONDITIONS
GRIP_TYPES   // hangboard grip positions
EDGE_SIZES   // [5,8,10,12,15,18,20,25,30,40] mm
ACHIEVEMENTS // array with {id, label, desc, test(d)} where test takes computeDerived output
```

`computeDerived(sessions, activeSession?)` returns aggregated stats used everywhere — don't recompute inline.

## Cache Busting

Every deploy requires bumping the version string in **two places**:
1. `sw.js` → `const CACHE = 'crux-vYYYYMMDD';`
2. `index.html` → all `?v=YYYYMMDD` query strings on script tags

Both must match. Increment the date (or just the number) to force cache invalidation.

## Supabase Sync

- On load: fetch all rows for `auth.uid()`, merge with localStorage, resolve conflicts by `startTime`
- On write: `setSessions` saves to localStorage immediately, then upserts to Supabase
- Deletions: add the id to `deletedIdsRef` before removing from state so sync doesn't resurrect it
- RLS: users can only read/write their own rows

## Achievements

Defined in `crux-data.jsx` as `ACHIEVEMENTS` array. Each has a `test(d)` function that takes `computeDerived` output. `evalAchievements(d)` returns all achievements with `earned: bool`.

In `crux-app.jsx`, `earnedAchRef` is initialised silently on first render (existing earned achievements don't toast on page load). New achievements trigger `toastQueue` entries which display one at a time via `AchievementToast`.

## Warm-Up Program

`WARMUP_STEPS` in `crux-training.jsx` defines a 9-step ~7 min guided warm-up. Steps have `type: 'mobility' | 'stretch' | 'hang'`. Multi-set hang steps include `sets` and `rest` fields. The `WarmUpOverlay` state machine: `preview → working → resting → working → ... → done (3s countdown) → next step auto-starts`.

## Conventions

- React state aliases: `sState/sEffect` in crux-screens, `tState/tEffect` in crux-training, `aState/aEffect/aRef` in crux-app
- Functional updaters (`setState(prev => ...)`) used inside timer intervals to avoid stale closures
- No TypeScript, no build tools, no package.json — everything runs directly in the browser
- `uid()` from crux-data for generating IDs
- `fmtDate(ts)`, `fmtTime(ts)` for display formatting
- Do not add comments unless the reason is non-obvious
