# Implementation Plan: Haunted Escape

## Overview

Tasks are ordered by dependency: shared types and pure logic first, then persistence, then the central state hook, then UI components, then styles, and finally automated tests. The final task is an end-to-end smoke check that confirms the build and all tests pass before the feature is considered done.

Each task maps to one or more requirements from `requirements.md` and follows the component tree and data models defined in `design.md`.

---

## Tasks

- [x] 1. Project setup and type definitions
  - Install `vitest`, `@vitest/ui`, `jsdom`, and `@testing-library/react` as dev dependencies if not already present in `package.json`.
  - Configure Vitest in `vite.config.ts`: set `environment: 'jsdom'` as default and `globals: true` so test files do not require explicit imports of `describe`/`it`/`expect`.
  - Create `src/game/types.ts` and export: `Screen`, `RoomId`, `ChallengeType`, `GameState`, `RoomDefinition`, `SubmitResult`.
  - _References: design.md §Data Models, §Dependencies; REQ-11, REQ-13_

- [x] 2. Game logic — pure validation functions
  - Create `src/game/gameLogic.ts`.
  - Implement `normalizeText(input: string): string` — lowercases, trims, and strips diacritics via `String.prototype.normalize('NFD')` + Unicode combining-mark regex.
  - Implement `validateRoom1(answer: string): boolean` — returns `true` only when `normalizeText(answer) === 'libro'`.
  - Implement `validateRoom2(selection: string | null): boolean` — returns `true` only when `selection === 'morada'`.
  - Implement `validateRoom3(code: string): boolean` — returns `true` only when `code.trim() === '241'`.
  - Export all four functions; no React imports allowed in this file.
  - _References: design.md §gameLogic.ts; REQ-5 AC-1, REQ-6 AC-1, REQ-7 AC-1, REQ-11 AC-1_

- [x] 3. Room definitions
  - Create `src/game/rooms.ts`.
  - Export a `ROOMS` constant typed as `Record<RoomId, RoomDefinition>` with three static entries:
    - Room 1 — title `"Biblioteca Maldita"`, emoji `"📚"`, riddle text, hint `"Piensa en el objeto que más abunda en una biblioteca"`, challengeType `"text"`.
    - Room 2 — title `"Laboratorio de la Bruja"`, emoji `"🧪"`, description, hint `"La piedra amatista revela el color de la poción que romperá el hechizo"`, challengeType `"potion"`.
    - Room 3 — title `"Cripta Encantada"`, emoji `"💀"`, description, hint `"Cuenta cada símbolo en el orden en que aparecen"`, challengeType `"crypt"`.
  - _References: design.md §RoomDefinition; REQ-5, REQ-6, REQ-7, REQ-9_

- [x] 4. localStorage persistence module
  - Create `src/game/storage.ts`.
  - Define `STORAGE_KEY = 'haunted-escape-progress'`.
  - Implement `isValidGameState(parsed: unknown): parsed is GameState` — type guard verifying all required fields and valid enum values.
  - Implement `loadState(): GameState | null` — wraps `localStorage.getItem`, `JSON.parse`, and the type guard in a `try/catch`; returns `null` on any error or invalid shape (never throws).
  - Implement `saveState(state: GameState): void` — wraps `localStorage.setItem` in a `try/catch`; silently swallows quota or security errors.
  - Implement `clearState(): void` — calls `localStorage.removeItem(STORAGE_KEY)` inside a `try/catch`.
  - _References: design.md §storage.ts, §Error Handling; REQ-4, REQ-11 AC-2_

- [x] 5. Central state hook — `useGameState`
  - Create `src/game/useGameState.ts`.
  - Implement `useGameState()` returning `UseGameStateReturn` as defined in `design.md`.
  - On mount: call `loadState()`; if a valid `GameState` is found, set `hasSavedProgress = true` and store it without auto-navigating; otherwise use the initial state `{ currentScreen: 'start', completedRooms: 0, unlockedRoom: 1 }`.
  - Implement `startGame()` — clears localStorage, resets to initial state, sets `screen` to `'room-1'`.
  - Implement `continueGame()` — applies the saved `GameState` and navigates to its `currentScreen`.
  - Implement `submitAnswer(roomId, answer)` — delegates to the correct validator; on success increments `completedRooms`, advances `screen` and `unlockedRoom`, saves state, returns `{ correct: true }`; on failure returns `{ correct: false; message }` without mutating state.
  - Implement `restartGame()` — calls `clearState()` and resets all state to initial, setting `screen` to `'start'`.
  - Persist on every state change via `useEffect` calling `saveState`, except when `currentScreen === 'start'`.
  - Enforce correctness properties CP-1 through CP-5 from `design.md`.
  - _References: design.md §useGameState.ts, §State Transitions, §Correctness Properties; REQ-1, REQ-2, REQ-4_

- [x] 6. App root and screen routing
  - Replace the contents of `src/App.tsx`: consume `useGameState()` and render the correct screen based on `screen`.
  - Render `<Header completedRooms={completedRooms} />` unconditionally above every screen.
  - Pass only the props each screen requires — no extra prop-drilling.
  - Remove all default Vite placeholder content from `App.tsx` that conflicts with the new design.
  - _References: design.md §App.tsx; REQ-2, REQ-3_

- [x] 7. Layout components — `Layout` and `Header`
  - Create `src/components/layout/Layout.tsx` — a `<div>` wrapper with the Halloween background class; accepts `children`.
  - Create `src/components/layout/Header.tsx` — renders the game title `"🏚️ Haunted Escape"` and `<ProgressBar completedRooms={completedRooms} />`.
  - Create `src/components/shared/ProgressBar.tsx` — renders exactly 3 pip elements; filled pips use the orange accent color; the wrapper has `aria-label` set to `"${completedRooms} de 3 desafíos completados"`.
  - _References: design.md §Header.tsx, §ProgressBar.tsx; REQ-3, REQ-12_

- [x] 8. Start screen
  - Create `src/components/screens/StartScreen.tsx` implementing `StartScreenProps`.
  - Render the full narrative intro text (Halloween night, player trapped, three rooms to escape).
  - When `hasSavedProgress` is `false`: render one "Comenzar" button calling `onStart()`.
  - When `hasSavedProgress` is `true`: render "Continuar" (calls `onContinue()`) and "Nueva partida" (calls `onRestart()`).
  - The narrative text must appear above all action buttons.
  - _References: design.md §StartScreen.tsx; REQ-1 AC-1/2/3/4_

- [x] 9. Shared feedback and hint components
  - Create `src/components/shared/FeedbackMessage.tsx` — accepts `type: 'success' | 'error'` and `message: string`; applies CSS class `feedback--success` or `feedback--error`; uses `role="alert"`.
  - Create `src/components/shared/HintButton.tsx` — accepts `hint`, `visible`, and `onToggle`; renders a toggle button labeled `"Ver pista"` / `"Ocultar pista"` and conditionally renders the hint text.
  - _References: design.md §FeedbackMessage.tsx, §HintButton.tsx; REQ-8, REQ-9_

- [x] 10. Challenge — Room 1 (TextChallenge)
  - Create `src/components/challenges/TextChallenge.tsx`.
  - Render the riddle text and a controlled `<input type="text">` inside a `<form>`.
  - On submit with an empty field: call `onSubmit('')`; the hook returns a validation error.
  - On submit with a value: call `onSubmit(value)`.
  - Preserve the input value on an incorrect answer; clear it only when `roomId` changes.
  - _References: design.md §Challenge components; REQ-5, REQ-8 AC-3_

- [x] 11. Challenge — Room 2 (PotionChallenge)
  - Create `src/components/challenges/PotionChallenge.tsx`.
  - Render three potion `<button>` cards for `'roja'`, `'morada'`, and `'verde'` with `aria-pressed` reflecting the selection.
  - Render a "Confirmar" button that calls `onSubmit(selectedPotion ?? null)`.
  - Preserve the current selection on an incorrect answer.
  - Apply `potion--roja`, `potion--morada`, or `potion--verde` CSS class to each card.
  - _References: design.md §Challenge components; REQ-6, REQ-8 AC-3_

- [x] 12. Challenge — Room 3 (CryptChallenge)
  - Create `src/components/challenges/CryptChallenge.tsx`.
  - Display the symbol group: 2 × 🦇, 4 × 🕯️, 1 × 💀, each group visually labeled with its count.
  - Render a controlled `<input type="text" inputMode="numeric" maxLength={3}>` inside a `<form>`.
  - On submit with fewer than 3 characters: call `onSubmit('')`; otherwise call `onSubmit(value)`.
  - Preserve the input value on an incorrect answer.
  - _References: design.md §Challenge components; REQ-7, REQ-8 AC-3_

- [x] 13. Room screen wrapper
  - Create `src/components/screens/RoomScreen.tsx` implementing `RoomScreenProps`.
  - Own local UI state: `feedbackState` and `hintVisible`; reset both to their initial values when `roomId` changes.
  - Render: room emoji + title, narrative description, `<HintButton>`, the challenge component selected by `room.challengeType`, and `<FeedbackMessage>` when `feedbackState` is not null.
  - On a correct submit: show success feedback, then call `onAdvance()` after a 1 500 ms delay.
  - On an incorrect submit: show error feedback without advancing; preserve the player's input.
  - _References: design.md §RoomScreen.tsx; REQ-2, REQ-5, REQ-6, REQ-7, REQ-8, REQ-9_

- [x] 14. Victory screen
  - Create `src/components/screens/VictoryScreen.tsx` implementing `VictoryScreenProps`.
  - Render the heading `"¡Escapaste de la Mansión Embrujada!"`, a summary message, and a "Jugar de nuevo" button calling `onRestart()`.
  - Render a confetti animation: a set of fixed-position `<span>` elements with random horizontal positions and staggered `animation-delay` values using the `confettiFall` CSS keyframe.
  - Use only CSS classes or inline styles — no external animation library.
  - _References: design.md §VictoryScreen.tsx; REQ-10 AC-1/2/3_

- [ ] 15. CSS design system and animations
  - In `src/index.css`: define all CSS custom properties listed in `design.md §CSS Design Tokens` (color tokens, radius values, transition).
  - Remove all default Vite styles from `src/index.css` that conflict with the Halloween theme.
  - In `src/App.css`: implement the full visual theme:
    - Dark background with `--color-bg` and a radial gradient.
    - `.room-card` — `width: min(640px, 92vw)`, `--radius-card` border-radius, `--color-surface` background.
    - Button styles: primary (orange), secondary (violet), danger variants.
    - Potion card color variants: `potion--roja`, `potion--morada`, `potion--verde`.
    - Feedback classes: `feedback--success`, `feedback--error` (triggers `shake` keyframe).
    - Progress pip styles: filled (orange), empty (muted violet).
    - `@keyframes shake`, `@keyframes fadeInUp`, `@keyframes confettiFall` as specified in `design.md §CSS Animations`.
    - Responsive breakpoint at 600 px: stack buttons vertically, adjust font sizes.
  - _References: design.md §CSS Design Tokens, §CSS Animations, §Responsive layout; REQ-12_

- [ ] 16. Unit tests — game logic
  - Create `src/game/__tests__/gameLogic.test.ts`; set Vitest environment to `node`.
  - Test `normalizeText`: lowercase conversion, leading/trailing trim, diacritic removal.
  - Test `validateRoom1`: `'libro'` (exact), `'LIBRO'` (uppercase), `'líbro'` (tilde), `'  libro  '` (spaces), wrong answer, empty string.
  - Test `validateRoom2`: `'morada'` (correct), `'roja'`, `'verde'`, `null`.
  - Test `validateRoom3`: `'241'` (correct), wrong code, empty string, non-numeric input.
  - _References: design.md §Testing Strategy; REQ-13 AC-1_

- [ ] 17. Unit tests — storage
  - Create `src/game/__tests__/storage.test.ts`; set Vitest environment to `jsdom`.
  - Call `localStorage.clear()` in `beforeEach`.
  - Test `saveState` → `loadState` round-trip returns an identical object.
  - Test `loadState` returns `null` when the key is absent.
  - Test `loadState` returns `null` for malformed JSON.
  - Test `loadState` returns `null` for valid JSON with missing required fields.
  - Test `loadState` returns `null` for `completedRooms` out of range (e.g. `4`).
  - Test `clearState` removes the key so `loadState` subsequently returns `null`.
  - _References: design.md §Testing Strategy; REQ-13 AC-2_

- [ ] 18. Integration tests — `useGameState` hook
  - Create `src/game/__tests__/useGameState.test.ts`; set Vitest environment to `jsdom`.
  - Use `renderHook` and `act` from `@testing-library/react`.
  - Test `startGame()` → `screen === 'room-1'`, `completedRooms === 0`.
  - Test `submitAnswer(1, 'libro')` → `screen === 'room-2'`, `completedRooms === 1`.
  - Test `submitAnswer(1, 'wrong')` → `screen === 'room-1'`, `completedRooms === 0`, returns `{ correct: false }`.
  - Test full playthrough (three correct answers) → `screen === 'victory'`, `completedRooms === 3`.
  - Test `restartGame()` → `screen === 'start'`, `completedRooms === 0`, localStorage key absent.
  - Test `continueGame()` with valid saved state → restores `screen` and `completedRooms`.
  - Test `continueGame()` with corrupt localStorage → starts fresh with `screen === 'room-1'`.
  - Assert correctness properties CP-1 through CP-5 inline in the relevant tests.
  - _References: design.md §Testing Strategy, §Correctness Properties; REQ-13 AC-3_

- [ ] 19. End-to-end smoke check
  - Run `npm run build` and confirm it exits without errors.
  - Run `npx vitest run` and confirm all tests pass with 0 failures.
  - Manually verify in the browser:
    - Start screen renders with narrative and "Comenzar" button.
    - Completing Room 1 updates the progress indicator and loads Room 2.
    - Completing all three rooms shows the victory screen with confetti.
    - Refreshing the browser restores the saved room.
    - "Jugar de nuevo" clears progress and returns to the start screen.
  - Fix any build or test failures before marking this task complete.
  - _References: all requirements_

---

## Notes

### Implementation conventions

- **Logic / UI separation:** files under `src/game/` must not import from `src/components/` and must not contain JSX. This boundary is enforced by the test strategy (logic tests run in the `node` environment with no DOM mount).
- **No external runtime dependencies:** do not introduce libraries beyond those already listed in `design.md §Dependencies`. Animations are CSS-only; state management is a custom hook.
- **Controlled inputs:** all challenge form fields are controlled React components. Input values are preserved on incorrect answers and reset only when the parent `roomId` prop changes.
- **1 500 ms advance delay:** the success-to-advance transition in `RoomScreen` uses `setTimeout`. Clean up the timer in the `useEffect` return to prevent state updates on unmounted components.
- **localStorage resilience:** `loadState` and `saveState` both wrap every browser storage call in `try/catch`. The game must remain fully playable in-memory even when storage is unavailable (e.g. private browsing with strict settings).
- **Accessibility baseline:** use native `<button>` and `<input>` elements; add `role="alert"` to `FeedbackMessage`; use `aria-pressed` on potion cards; set `aria-label` on the progress indicator.

### Optional enhancements (not part of MVP)

The following are out of scope for the initial delivery and must not block the MVP:

- Sound effects or background music.
- Animated room transitions (beyond CSS `fadeInUp`).
- Leaderboard or elapsed-time tracking.
- Additional rooms or difficulty levels.

### MVP validation criteria

The MVP is considered complete when:

1. All 19 tasks are checked off.
2. `npm run build` exits with code 0.
3. `npx vitest run` exits with code 0 and reports no failing tests.
4. The game is manually playable from start to victory in a browser without console errors.
5. Refreshing mid-game restores the correct room (localStorage round-trip verified).

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": "wave-1",
      "description": "Foundation — no dependencies",
      "tasks": ["1"]
    },
    {
      "id": "wave-2",
      "description": "Pure logic layer — depends on types (task 1)",
      "tasks": ["2", "3"]
    },
    {
      "id": "wave-3",
      "description": "Persistence — depends on types (task 1)",
      "tasks": ["4"]
    },
    {
      "id": "wave-4",
      "description": "State hook — depends on logic (task 2), rooms (task 3), storage (task 4)",
      "tasks": ["5"]
    },
    {
      "id": "wave-5",
      "description": "Shared UI primitives — depends on types (task 1)",
      "tasks": ["7", "9"]
    },
    {
      "id": "wave-6",
      "description": "Challenge components — depend on shared UI (task 9) and room definitions (task 3)",
      "tasks": ["10", "11", "12"]
    },
    {
      "id": "wave-7",
      "description": "Screen components — depend on challenge components (tasks 10-12) and shared UI (tasks 7, 9)",
      "tasks": ["8", "13", "14"]
    },
    {
      "id": "wave-8",
      "description": "App root — depends on all screens (tasks 8, 13, 14) and state hook (task 5)",
      "tasks": ["6"]
    },
    {
      "id": "wave-9",
      "description": "Visual design system — can run in parallel with wave-8",
      "tasks": ["15"]
    },
    {
      "id": "wave-10",
      "description": "Automated tests — depend on logic (task 2), storage (task 4), state hook (task 5)",
      "tasks": ["16", "17", "18"]
    },
    {
      "id": "wave-11",
      "description": "Final verification — depends on all previous tasks",
      "tasks": ["19"]
    }
  ]
}
```
