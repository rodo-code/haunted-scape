// @vitest-environment jsdom
// Integration tests for useGameState — REQ-13 AC-3
// Verifies the full state machine and all correctness properties CP-1 through CP-5.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../useGameState';
import { STORAGE_KEY } from '../storage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wipes localStorage before and after each test for isolation. */
function clearStorage() {
  localStorage.clear();
}

beforeEach(clearStorage);
afterEach(clearStorage);

// Correct answers for each room
const CORRECT_ROOM_1 = 'libro';
const CORRECT_ROOM_2 = 'morada';
const CORRECT_ROOM_3 = '241';
const WRONG_ANSWER = 'wrong';

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state (no saved progress)', () => {
  it('starts on the start screen with 0 completed rooms', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.screen).toBe('start');
    expect(result.current.completedRooms).toBe(0);
  });

  it('reports no saved progress when localStorage is empty', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.hasSavedProgress).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// startGame
// ---------------------------------------------------------------------------

describe('startGame()', () => {
  it('navigates to room-1', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    expect(result.current.screen).toBe('room-1');
  });

  it('resets completedRooms to 0', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    expect(result.current.completedRooms).toBe(0);
  });

  it('clears any existing saved progress from localStorage', () => {
    // Pre-populate storage with progress
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentScreen: 'room-2',
      completedRooms: 1,
      unlockedRoom: 2,
    }));
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    // Storage should have been cleared then overwritten by persistence effect;
    // the new value should reflect room-1, not the old room-2.
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.currentScreen).toBe('room-1');
    expect(stored.completedRooms).toBe(0);
  });

  it('sets hasSavedProgress to false', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentScreen: 'room-2',
      completedRooms: 1,
      unlockedRoom: 2,
    }));
    const { result } = renderHook(() => useGameState());
    expect(result.current.hasSavedProgress).toBe(true);
    act(() => { result.current.startGame(); });
    expect(result.current.hasSavedProgress).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// continueGame
// ---------------------------------------------------------------------------

describe('continueGame()', () => {
  it('restores screen and completedRooms from localStorage (REQ-1 AC-2)', () => {
    const saved = { currentScreen: 'room-2', completedRooms: 1, unlockedRoom: 2 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.continueGame(); });
    expect(result.current.screen).toBe('room-2');
    expect(result.current.completedRooms).toBe(1);
  });

  it('falls back to startGame() behaviour when localStorage is empty', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.continueGame(); });
    // No saved state — should behave like startGame
    expect(result.current.screen).toBe('room-1');
    expect(result.current.completedRooms).toBe(0);
  });

  it('falls back to startGame() behaviour when localStorage is corrupt (CP-7)', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{');
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.continueGame(); });
    expect(result.current.screen).toBe('room-1');
    expect(result.current.completedRooms).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Saved-progress detection on mount
// ---------------------------------------------------------------------------

describe('saved progress detection on mount', () => {
  it('sets hasSavedProgress when valid state is in localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentScreen: 'room-3',
      completedRooms: 2,
      unlockedRoom: 3,
    }));
    const { result } = renderHook(() => useGameState());
    expect(result.current.hasSavedProgress).toBe(true);
  });

  it('does NOT auto-navigate away from start on mount even with saved progress', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentScreen: 'room-3',
      completedRooms: 2,
      unlockedRoom: 3,
    }));
    const { result } = renderHook(() => useGameState());
    // Must stay on 'start' until player explicitly chooses Continue
    expect(result.current.screen).toBe('start');
  });
});

// ---------------------------------------------------------------------------
// submitAnswer — CP-1, CP-2, CP-3
// ---------------------------------------------------------------------------

describe('submitAnswer() — correct answer', () => {
  it('advances screen from room-1 to room-2 (CP-1)', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    expect(result.current.screen).toBe('room-2');
  });

  it('increments completedRooms by exactly 1 (CP-1)', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    expect(result.current.completedRooms).toBe(1);
  });

  it('returns { correct: true }', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    let submitResult: ReturnType<typeof result.current.submitAnswer> | undefined;
    act(() => {
      submitResult = result.current.submitAnswer(1, CORRECT_ROOM_1);
    });
    expect(submitResult?.correct).toBe(true);
  });

  it('advances from room-2 to room-3', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    act(() => { result.current.submitAnswer(2, CORRECT_ROOM_2); });
    expect(result.current.screen).toBe('room-3');
    expect(result.current.completedRooms).toBe(2);
  });

  it('advances from room-3 to victory', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    act(() => { result.current.submitAnswer(2, CORRECT_ROOM_2); });
    act(() => { result.current.submitAnswer(3, CORRECT_ROOM_3); });
    expect(result.current.screen).toBe('victory');
    expect(result.current.completedRooms).toBe(3);
  });
});

describe('submitAnswer() — wrong answer (CP-3)', () => {
  it('does NOT advance the screen', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, WRONG_ANSWER); });
    expect(result.current.screen).toBe('room-1');
  });

  it('does NOT increment completedRooms', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, WRONG_ANSWER); });
    expect(result.current.completedRooms).toBe(0);
  });

  it('returns { correct: false, message: string }', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    let submitResult: ReturnType<typeof result.current.submitAnswer> | undefined;
    act(() => {
      submitResult = result.current.submitAnswer(1, WRONG_ANSWER);
    });
    expect(submitResult?.correct).toBe(false);
    const failResult = submitResult as { correct: false; message: string } | undefined;
    if (failResult && !failResult.correct) {
      expect(typeof failResult.message).toBe('string');
      expect(failResult.message.length).toBeGreaterThan(0);
    }
  });

  it('handles null answer (no potion selected) for room 2', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); }); // advance to room-2
    let submitResult: ReturnType<typeof result.current.submitAnswer> | undefined;
    act(() => {
      submitResult = result.current.submitAnswer(2, null);
    });
    expect(submitResult?.correct).toBe(false);
    expect(result.current.screen).toBe('room-2');
  });
});

// ---------------------------------------------------------------------------
// CP-2 — completedRooms always in [0, 3]
// ---------------------------------------------------------------------------

describe('CP-2 — bounded progress', () => {
  it('completedRooms is 3 after a full playthrough', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    act(() => { result.current.submitAnswer(2, CORRECT_ROOM_2); });
    act(() => { result.current.submitAnswer(3, CORRECT_ROOM_3); });
    expect(result.current.completedRooms).toBe(3);
  });

  it('completedRooms never exceeds 3 even if submitAnswer is called from victory screen', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    act(() => { result.current.submitAnswer(2, CORRECT_ROOM_2); });
    act(() => { result.current.submitAnswer(3, CORRECT_ROOM_3); });
    // Attempt to call submitAnswer again from victory (edge case)
    act(() => { result.current.submitAnswer(3, CORRECT_ROOM_3); });
    expect(result.current.completedRooms).toBeLessThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// restartGame — CP-5
// ---------------------------------------------------------------------------

describe('restartGame() (CP-5)', () => {
  it('sets screen to "start"', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    act(() => { result.current.restartGame(); });
    expect(result.current.screen).toBe('start');
  });

  it('resets completedRooms to 0', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    act(() => { result.current.restartGame(); });
    expect(result.current.completedRooms).toBe(0);
  });

  it('clears the localStorage entry', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    // At this point localStorage has room-2 state
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    act(() => { result.current.restartGame(); });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('sets hasSavedProgress to false', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    act(() => { result.current.restartGame(); });
    expect(result.current.hasSavedProgress).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Persistence (REQ-4)
// ---------------------------------------------------------------------------

describe('persistence', () => {
  it('does NOT write to localStorage when on the start screen', () => {
    renderHook(() => useGameState());
    // After mount with no saved progress, screen is 'start' — nothing saved
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('writes to localStorage after advancing to room-1', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.currentScreen).toBe('room-1');
  });

  it('persists state after each correct answer', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.currentScreen).toBe('room-2');
    expect(stored.completedRooms).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Full playthrough integration
// ---------------------------------------------------------------------------

describe('full playthrough', () => {
  it('completes all three rooms and reaches victory with completedRooms === 3', () => {
    const { result } = renderHook(() => useGameState());

    act(() => { result.current.startGame(); });
    expect(result.current.screen).toBe('room-1');
    expect(result.current.completedRooms).toBe(0);

    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    expect(result.current.screen).toBe('room-2');
    expect(result.current.completedRooms).toBe(1);

    act(() => { result.current.submitAnswer(2, CORRECT_ROOM_2); });
    expect(result.current.screen).toBe('room-3');
    expect(result.current.completedRooms).toBe(2);

    act(() => { result.current.submitAnswer(3, CORRECT_ROOM_3); });
    expect(result.current.screen).toBe('victory');
    expect(result.current.completedRooms).toBe(3);
  });

  it('can restart after victory and start a fresh game', () => {
    const { result } = renderHook(() => useGameState());
    act(() => { result.current.startGame(); });
    act(() => { result.current.submitAnswer(1, CORRECT_ROOM_1); });
    act(() => { result.current.submitAnswer(2, CORRECT_ROOM_2); });
    act(() => { result.current.submitAnswer(3, CORRECT_ROOM_3); });

    act(() => { result.current.restartGame(); });
    expect(result.current.screen).toBe('start');
    expect(result.current.completedRooms).toBe(0);
    expect(result.current.hasSavedProgress).toBe(false);
  });
});
