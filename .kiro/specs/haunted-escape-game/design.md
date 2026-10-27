# Design Document — Haunted Escape: La Mansión Embrujada

## Overview

Single-page React application without a router. Navigation is driven entirely by a central game state object held in a custom hook. The state machine has five possible screens: `start`, `room-1`, `room-2`, `room-3`, and `victory`. Transitioning between screens is a pure state update — no URL changes, no browser history entries needed.

The architecture enforces a strict separation between game logic (pure functions and custom hooks) and UI components. All validation, state transitions, and persistence live in `src/game/`; React components in `src/components/` are purely presentational and call hook callbacks. This satisfies REQ-11 and makes the logic layer testable without mounting React components.

---

## Architecture

```
src/
├── game/                        # Pure logic — no React imports except hooks
│   ├── types.ts                 # Shared TypeScript types and interfaces
│   ├── rooms.ts                 # Room definitions: riddle, hint, validator
│   ├── gameLogic.ts             # Pure functions: validateAnswer, normalizeText
│   ├── storage.ts               # localStorage read/write/clear/parse
│   └── useGameState.ts          # Central state hook (the only stateful logic)
│
├── components/                  # Presentational React components
│   ├── layout/
│   │   ├── Header.tsx           # Progress indicator + title bar (always visible)
│   │   └── Layout.tsx           # Page wrapper with Halloween background
│   ├── screens/
│   │   ├── StartScreen.tsx      # Intro narrative + Comenzar/Continuar/Nueva partida
│   │   ├── RoomScreen.tsx       # Generic room shell (title, description, challenge)
│   │   └── VictoryScreen.tsx    # Celebration screen + Jugar de nuevo
│   ├── challenges/
│   │   ├── TextChallenge.tsx    # Room 1: text input form
│   │   ├── PotionChallenge.tsx  # Room 2: three selectable potion cards
│   │   └── CryptChallenge.tsx   # Room 3: numeric input
│   └── shared/
│       ├── FeedbackMessage.tsx  # Success/error banner with animation class
│       ├── HintButton.tsx       # Toggle hint visibility
│       └── ProgressBar.tsx      # Visual step indicator (0–3 filled pips)
│
├── App.tsx                      # Root: reads screen from hook, renders correct screen
├── index.css                    # CSS custom properties (palette, fonts)
└── App.css                      # Layout, animations, component styles
```

### State Transitions

```
[start]
   │  startGame() / continueGame()
   ▼
[room-1] ──── submitAnswer(1, answer) correct ───▶ [room-2]
                                                       │
                                         submitAnswer(2, answer) correct
                                                       ▼
                                                   [room-3]
                                                       │
                                         submitAnswer(3, answer) correct
                                                       ▼
                                                  [victory]
                                                       │
                                               restartGame()
                                                       ▼
                                                   [start]
```

Incorrect answers stay on the same screen; hook state does not change. Only the local `feedbackState` inside `RoomScreen` updates.

---

## Components and Interfaces

### `App.tsx`

Root component. Consumes `useGameState()` and renders the correct screen based on the current `screen` value. Passes only the actions each screen needs as props — no Context API required given the shallow tree.

```typescript
// Rendering logic
screen === 'start'   → <StartScreen onStart={startGame} onContinue={continueGame} hasSavedProgress={hasSavedProgress} />
screen === 'room-1'  → <RoomScreen roomId={1} onSubmit={submitAnswer} onAdvance={...} />
screen === 'room-2'  → <RoomScreen roomId={2} onSubmit={submitAnswer} onAdvance={...} />
screen === 'room-3'  → <RoomScreen roomId={3} onSubmit={submitAnswer} onAdvance={...} />
screen === 'victory' → <VictoryScreen completedRooms={completedRooms} onRestart={restartGame} />
```

### `Header.tsx`

Always rendered. Contains game title and `<ProgressBar completedRooms={n} />`.

```typescript
interface HeaderProps {
  completedRooms: number; // 0–3
}
```

### `ProgressBar.tsx`

Renders 3 pips. Filled pips use orange (`--color-accent-orange`), empty pips use muted violet. Uses `aria-label="X de 3 desafíos completados"` (REQ-3).

```typescript
interface ProgressBarProps {
  completedRooms: number; // 0–3
}
```

### `StartScreen.tsx`

Displays the narrative intro text. Shows "Comenzar" when no saved progress exists; shows "Continuar" and "Nueva partida" when saved progress is detected (REQ-1).

```typescript
interface StartScreenProps {
  hasSavedProgress: boolean;
  onStart(): void;
  onContinue(): void;
  onRestart(): void;
}
```

### `RoomScreen.tsx`

Generic wrapper shared by all three rooms. Owns local UI state only — never persisted.

```typescript
interface RoomScreenProps {
  roomId: RoomId;                               // determines which challenge to render
  room: RoomDefinition;                         // static room data from rooms.ts
  onSubmit(roomId: RoomId, answer: string | null): SubmitResult;
  onAdvance(): void;                            // called after success delay (1 500 ms)
}

// Local state (not persisted)
feedbackState: { type: 'success' | 'error'; message: string } | null
hintVisible: boolean  // reset to false when roomId prop changes (REQ-9 AC-3)
```

On successful submit: shows success feedback, then after a 1 500 ms delay calls `onAdvance()`.

### `FeedbackMessage.tsx`

```typescript
interface FeedbackMessageProps {
  type: 'success' | 'error';
  message: string;
}
```

Applies CSS class `feedback--success` or `feedback--error`. The error class triggers a CSS `@keyframes shake` animation (REQ-8 AC-2). Uses `role="alert"` for screen reader announcements.

### `HintButton.tsx`

```typescript
interface HintButtonProps {
  hint: string;
  visible: boolean;
  onToggle(): void;
}
```

Toggle button — shows/hides the hint text (REQ-9 AC-1, AC-2).

### Challenge components

Each challenge component renders its input and calls `onSubmit(answer)` provided by `RoomScreen`. They own their own controlled input state and reset it only on successful advance, never on error (REQ-8 AC-3).

```typescript
// Shared callback shape for all challenge components
interface ChallengeProps {
  onSubmit(answer: string | null): void;
}
```

| Component | Input type | Validation trigger |
|---|---|---|
| `TextChallenge` | `<input type="text">` | form submit |
| `PotionChallenge` | 3 clickable cards (`aria-pressed`) | confirm button |
| `CryptChallenge` | `<input type="text" inputMode="numeric" maxLength={3}>` | form submit |

### `VictoryScreen.tsx`

```typescript
interface VictoryScreenProps {
  completedRooms: number; // always 3 when rendered
  onRestart(): void;
}
```

Renders the "¡Escapaste de la Mansión Embrujada!" message and a confetti animation (REQ-10). Confetti is a set of `<span>` elements with `position: fixed` and random horizontal positions — no canvas, no external library.

### `useGameState.ts` — Central state hook

Holds and coordinates all runtime state. Persists to localStorage on every state change via `useEffect`.

```typescript
interface UseGameStateReturn {
  screen: Screen;
  completedRooms: number;
  hasSavedProgress: boolean;
  startGame(): void;
  continueGame(): void;
  submitAnswer(roomId: RoomId, answer: string | null): SubmitResult;
  restartGame(): void;
}

type SubmitResult = { correct: true } | { correct: false; message: string };
```

`submitAnswer` calls the appropriate validator from `gameLogic.ts`, advances `completedRooms` and `currentScreen` on success, and returns the result for the component to render as feedback. The hook never renders anything directly.

### `gameLogic.ts` — Pure validation functions

```typescript
// Normalize Spanish text: lowercase, trim, remove diacritics
function normalizeText(input: string): string

// Room 1: accepts "libro" in any case/accent/whitespace variant
function validateRoom1(answer: string): boolean

// Room 2: accepts only 'morada'
function validateRoom2(selection: string | null): boolean

// Room 3: accepts only '241'
function validateRoom3(code: string): boolean
```

Plain functions with no side effects — trivially testable with Vitest without mounting React (REQ-11 AC-1).

### `storage.ts` — localStorage encapsulation

```typescript
const STORAGE_KEY = 'haunted-escape-progress';

function loadState(): GameState | null   // returns null on missing or corrupt data
function saveState(state: GameState): void
function clearState(): void
```

---

## Data Models

### `Screen` and `RoomId`

```typescript
type Screen = 'start' | 'room-1' | 'room-2' | 'room-3' | 'victory';
type RoomId = 1 | 2 | 3;
type ChallengeType = 'text' | 'potion' | 'crypt';
```

### `GameState` — persisted to localStorage

The only structure written to localStorage. UI-only state (hint visibility, current input value, feedback message) is never persisted.

```typescript
interface GameState {
  currentScreen: Screen;    // active screen; drives rendering in App.tsx
  completedRooms: number;   // 0–3; incremented on each correct answer
  unlockedRoom: RoomId;     // highest room the player may access (REQ-2)
}
```

Persistence rules:
- Saved on every state change except when `currentScreen === 'start'` (start screen = clean slate).
- On mount, `loadState()` initializes state; if it returns `null`, state defaults to `{ currentScreen: 'start', completedRooms: 0, unlockedRoom: 1 }`.
- `clearState()` is called by `restartGame()` and `startGame()` (REQ-4 AC-2).

### `RoomDefinition` — static, not persisted

```typescript
interface RoomDefinition {
  id: RoomId;
  title: string;            // e.g. "Biblioteca Maldita"
  emoji: string;            // decorative room emoji
  description: string;      // narrative text shown above the challenge
  hint: string;             // shown when player requests it (REQ-9)
  challengeType: ChallengeType;
}
```

Room definitions are static constants in `rooms.ts` — never mutated at runtime.

### `Challenge` — answer validation contract

```typescript
interface Challenge {
  roomId: RoomId;
  validate(answer: string | null): boolean;
}
```

Each room's validator is a pure function exported from `gameLogic.ts`. The `Challenge` interface formalises the contract but is not instantiated as objects — it documents the expected shape for testing purposes.

### `SubmitResult` — return value of `submitAnswer`

```typescript
type SubmitResult =
  | { correct: true }
  | { correct: false; message: string };
```

The `message` field is the user-facing error string rendered by `FeedbackMessage`. It is never stored in `GameState`.

### CSS Design Tokens

```css
:root {
  --color-bg:            #0d0014;   /* near-black with violet tint */
  --color-surface:       #1a0a2e;   /* card / panel background */
  --color-surface-2:     #2d1557;   /* elevated surface, borders */
  --color-accent-violet: #7b2fbe;   /* primary accent */
  --color-accent-orange: #ff6b00;   /* Halloween orange */
  --color-accent-green:  #39d353;   /* success, potion verde */
  --color-text:          #e8d5ff;   /* primary text */
  --color-text-muted:    #9b7ec8;   /* secondary text */
  --color-error:         #ff4444;
  --color-success:       #39d353;

  --radius-card:  12px;
  --radius-btn:    8px;
  --transition:  200ms ease;
}
```

---

## Correctness Properties

These invariants must hold at all times and are verified by the test suite.

### CP-1 — Sequential progression (REQ-2)

`completedRooms` only ever increases by exactly 1, and only when `submitAnswer` returns `{ correct: true }`. It can never decrease except when `restartGame()` resets it to 0.

```
∀ state transitions: completedRooms_next ∈ { completedRooms_current, completedRooms_current + 1, 0 }
```

### CP-2 — Bounded progress (REQ-3)

`completedRooms` is always in the range [0, 3]. It never exceeds 3, even if `submitAnswer` is called from the victory screen.

```
∀ states: 0 ≤ completedRooms ≤ 3
```

### CP-3 — No advancement on incorrect answer (REQ-8)

An incorrect answer leaves `currentScreen` and `completedRooms` unchanged. Only `feedbackState` (local UI state, not persisted) changes.

```
submitAnswer(roomId, wrongAnswer).correct === false
  → currentScreen unchanged
  → completedRooms unchanged
```

### CP-4 — Room access control (REQ-2 AC-1)

The screen rendered by `App.tsx` is always `≤ unlockedRoom`. A player can never render room N+1 without having completed room N first.

```
screen ∈ {'room-1','room-2','room-3'} → roomIdOf(screen) ≤ unlockedRoom
```

### CP-5 — Reset returns to initial state (REQ-1 AC-3, REQ-10 AC-2)

After `restartGame()`:
- `currentScreen === 'start'`
- `completedRooms === 0`
- `unlockedRoom === 1`
- localStorage entry is absent

### CP-6 — Persistence round-trip (REQ-4 AC-1)

`loadState(saveState(s))` returns a value deeply equal to `s` for any valid `GameState` `s`.

### CP-7 — Corrupt storage fallback (REQ-4 AC-3)

`loadState()` returns `null` (never throws) for any malformed, missing, or shape-mismatched localStorage value, causing the app to start from the initial state.

---

## Error Handling

### Invalid answers (REQ-5, REQ-6, REQ-7, REQ-8)

| Scenario | Behaviour |
|---|---|
| Empty text input (Room 1) | `validateRoom1('')` returns `false`; `FeedbackMessage` shows validation error; input is not cleared (REQ-8 AC-3). |
| Wrong text answer (Room 1) | `validateRoom1(answer)` returns `false`; error feedback shown; state unchanged. |
| No potion selected (Room 2) | `validateRoom2(null)` returns `false`; validation message shown before calling validator. |
| Wrong potion (Room 2) | `validateRoom2(selection)` returns `false`; error feedback shown. |
| Fewer than 3 digits (Room 3) | Component-level guard rejects submit before calling `submitAnswer`; validation message shown. |
| Wrong code (Room 3) | `validateRoom3(code)` returns `false`; error feedback shown. |

All error paths: `currentScreen` and `completedRooms` remain unchanged. The input value is preserved in the component's controlled state.

### localStorage errors (REQ-4 AC-3)

`loadState()` wraps the full parse-and-validate sequence in a `try/catch`:

```typescript
function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidGameState(parsed)) return null;
    return parsed;
  } catch {
    return null;                  // JSON.parse error, SecurityError, QuotaExceededError
  }
}
```

`isValidGameState` is a type-guard that checks all required fields and valid enum values. Any mismatch returns `null` and the app starts fresh — no error is surfaced to the player (REQ-4 AC-3).

`saveState()` also wraps the write in a `try/catch`. If `localStorage.setItem` throws (e.g. storage quota exceeded or private-browsing restriction), the error is silently swallowed. The game continues in memory without persistence — functionally correct for the current session.

### Runtime component errors

Each challenge component validates its own input before calling `onSubmit` (empty field, incomplete code). This provides immediate feedback without a round-trip through the game logic layer and prevents `submitAnswer` from being called with clearly invalid data.

---

## Testing Strategy

Tests live in `src/game/__tests__/` and cover only the logic layer. No React component mounting is required, satisfying REQ-11 AC-1. Vitest is used as the test runner.

### Test environments

| Test file | Vitest environment | Reason |
|---|---|---|
| `gameLogic.test.ts` | `node` (default) | Pure functions, no DOM needed |
| `storage.test.ts` | `jsdom` | Requires `localStorage` |
| `useGameState.test.ts` | `jsdom` | React hook requires DOM |

### Unit tests — `gameLogic.test.ts` (REQ-13 AC-1)

Covers `normalizeText`, `validateRoom1`, `validateRoom2`, `validateRoom3`:

- Correct answer (exact match)
- Correct answer with uppercase
- Correct answer with diacritics / without tilde (Room 1)
- Correct answer with leading/trailing spaces (Room 1)
- Wrong answer
- Empty string
- `null` input (Room 2)

### Unit tests — `storage.test.ts` (REQ-13 AC-2)

Covers `saveState`, `loadState`, `clearState`:

- Save then load returns identical state
- Load returns `null` when key is absent
- Load returns `null` for corrupted JSON
- Load returns `null` for valid JSON with missing fields
- Load returns `null` for valid JSON with out-of-range values
- Clear removes the localStorage key

### Integration tests — `useGameState.test.ts` (REQ-13 AC-3)

Covers the hook's full state machine:

- `startGame()` → screen is `'room-1'`, completedRooms is 0 (CP-5)
- `submitAnswer(1, correctAnswer)` → screen advances to `'room-2'`, completedRooms is 1 (CP-1)
- `submitAnswer(1, wrongAnswer)` → screen remains `'room-1'`, completedRooms is 0 (CP-3)
- Full playthrough: three correct answers → screen is `'victory'`, completedRooms is 3 (CP-2)
- `restartGame()` → screen is `'start'`, completedRooms is 0, localStorage is cleared (CP-5)
- `continueGame()` with saved state → screen and completedRooms are restored (REQ-4 AC-1)
- `continueGame()` with corrupt localStorage → starts fresh (CP-7)

### Correctness property tests

The integration test file also includes property-style assertions that confirm invariants CP-1 through CP-7 hold across all tested state transitions.

---

## Dependencies

No new runtime dependencies are needed. The existing `package.json` already includes everything required:

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `vite` + `@vitejs/plugin-react` | Build tool |
| `typescript` | Type safety |
| `vitest` | Test runner |
| `jsdom` | DOM environment for hook and storage tests |
| `@testing-library/react` | Available if component tests are added later |

No router, no animation library, no state management library.

### CSS Animations

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-5px); }
  80%       { transform: translateX(5px); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes confettiFall {
  from { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
  to   { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
```

### Responsive layout

```css
.room-card {
  width: min(640px, 92vw);
  margin: 0 auto;
  padding: clamp(1rem, 4vw, 2.5rem);
}
```

Single breakpoint at 600 px adjusts font sizes and button layout (stack vertically on mobile, REQ-12 AC-1).

### Accessibility

- All interactive elements are native `<button>` or `<input>` — keyboard accessible by default.
- Feedback messages use `role="alert"` so screen readers announce them without focus management.
- Progress indicator uses `aria-label="X de 3 desafíos completados"`.
- Potion cards use `aria-pressed` to communicate selection state.
- Color is never the sole differentiator — error/success states also differ by icon (❌ / ✅) and text (REQ-12).
