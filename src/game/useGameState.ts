// Central state hook — drives all screen navigation and game logic.
// No direct DOM or localStorage access outside the imported modules.
// REQ-1, REQ-2, REQ-4; Correctness Properties CP-1 through CP-5.

import { useState, useEffect } from 'react';
import type { Screen, RoomId, GameState, SubmitResult } from './types';
import { loadState, saveState, clearState } from './storage';
import { validateRoom1, validateRoom2, validateRoom3 } from './gameLogic';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface UseGameStateReturn {
  screen: Screen;
  completedRooms: number;
  hasSavedProgress: boolean;
  startGame(): void;
  continueGame(): void;
  submitAnswer(roomId: RoomId, answer: string | null): SubmitResult;
  restartGame(): void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const INITIAL_STATE: GameState = {
  currentScreen: 'start',
  completedRooms: 0,
  unlockedRoom: 1,
};

/**
 * Maps a RoomId to its next Screen.
 * Room 3 advances to 'victory'; there is no room 4.
 */
function nextScreenForRoom(roomId: RoomId): Screen {
  if (roomId === 1) return 'room-2';
  if (roomId === 2) return 'room-3';
  return 'victory'; // roomId === 3
}

/**
 * Maps a RoomId to its next unlockedRoom value.
 * After completing room 3 we cap at 3 — there are only 3 rooms.
 * CP-2: completedRooms is always in [0, 3].
 */
function nextUnlockedRoom(roomId: RoomId): RoomId {
  if (roomId === 1) return 2;
  if (roomId === 2) return 3;
  return 3; // roomId === 3 — victory, stays at 3
}

/**
 * Delegates answer validation to the correct room validator.
 * Returns the user-facing error message for incorrect answers.
 */
function runValidator(roomId: RoomId, answer: string | null): SubmitResult {
  let correct: boolean;

  if (roomId === 1) {
    // validateRoom1 expects string; null means empty and will fail normalisation
    correct = validateRoom1(answer ?? '');
  } else if (roomId === 2) {
    correct = validateRoom2(answer);
  } else {
    // roomId === 3
    correct = validateRoom3(answer ?? '');
  }

  if (correct) {
    return { correct: true };
  }

  // Room-specific error messages
  const messages: Record<RoomId, string> = {
    1: 'Respuesta incorrecta. Piensa bien y vuelve a intentarlo.',
    2: 'Esa poción no es la correcta. Elige de nuevo.',
    3: 'Código incorrecto. Revisa los símbolos y vuelve a intentarlo.',
  };

  return { correct: false, message: messages[roomId] };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  // On mount: attempt to restore saved progress.
  // If valid state is found, record hasSavedProgress = true but do NOT
  // auto-navigate — wait for the player to choose Continue or New Game (REQ-1).
  useEffect(() => {
    const saved = loadState();
    if (saved !== null) {
      setHasSavedProgress(true);
      // Store internally so continueGame() can apply it later,
      // but keep currentScreen at 'start' until the player acts.
      setGameState({
        ...saved,
        currentScreen: 'start', // stay on start screen until player decides
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount only

  // Persist state on every change, except when currentScreen === 'start'.
  // The start screen represents a clean slate; writing it would create a
  // false "saved progress" entry on the next visit. (REQ-4)
  useEffect(() => {
    if (gameState.currentScreen !== 'start') {
      saveState(gameState);
    }
  }, [gameState]);

  // -------------------------------------------------------------------------
  // startGame — clears storage, resets to initial, navigates to room-1.
  // REQ-1 AC-1, REQ-1 AC-3; CP-5.
  // -------------------------------------------------------------------------
  function startGame(): void {
    clearState();
    setHasSavedProgress(false);
    setGameState({
      currentScreen: 'room-1',
      completedRooms: 0,
      unlockedRoom: 1,
    });
  }

  // -------------------------------------------------------------------------
  // continueGame — applies the saved state and navigates to its screen.
  // If no valid saved state exists, falls back to startGame behaviour.
  // REQ-1 AC-2.
  // -------------------------------------------------------------------------
  function continueGame(): void {
    const saved = loadState();
    if (saved !== null) {
      setGameState(saved);
    } else {
      // Saved state is gone (e.g. storage cleared externally) — start fresh
      startGame();
    }
  }

  // -------------------------------------------------------------------------
  // submitAnswer — validates the answer and advances state on success.
  // CP-1: completedRooms only increases by 1 on correct answer.
  // CP-2: completedRooms never exceeds 3.
  // CP-3: incorrect answer leaves currentScreen and completedRooms unchanged.
  // CP-4: unlockedRoom is updated in tandem with the screen advance.
  // -------------------------------------------------------------------------
  function submitAnswer(roomId: RoomId, answer: string | null): SubmitResult {
    const result = runValidator(roomId, answer);

    if (result.correct) {
      // CP-2: guard against advancing beyond 3 completed rooms
      const newCompletedRooms = Math.min(gameState.completedRooms + 1, 3);

      setGameState({
        currentScreen: nextScreenForRoom(roomId),
        completedRooms: newCompletedRooms,
        unlockedRoom: nextUnlockedRoom(roomId),
      });
    }
    // On incorrect answer: state is NOT mutated (CP-3).

    return result;
  }

  // -------------------------------------------------------------------------
  // restartGame — clears storage and resets all state to initial.
  // CP-5: after restartGame, screen === 'start', completedRooms === 0,
  //       unlockedRoom === 1, and localStorage is absent.
  // REQ-1 AC-3, REQ-10 AC-2.
  // -------------------------------------------------------------------------
  function restartGame(): void {
    clearState();
    setHasSavedProgress(false);
    setGameState(INITIAL_STATE);
  }

  return {
    screen: gameState.currentScreen,
    completedRooms: gameState.completedRooms,
    hasSavedProgress,
    startGame,
    continueGame,
    submitAnswer,
    restartGame,
  };
}
