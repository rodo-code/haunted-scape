// localStorage persistence module — no React imports allowed in this file.
// Encapsulates all browser storage access for the game.
// REQ-4, REQ-11 AC-2

import type { GameState, Screen, RoomId } from './types';

export const STORAGE_KEY = 'haunted-escape-progress';

// Valid enum values — used by the type guard below.
const VALID_SCREENS: Screen[] = ['start', 'room-1', 'room-2', 'room-3', 'victory'];
const VALID_ROOM_IDS: RoomId[] = [1, 2, 3];

/**
 * Type guard: returns true only when `parsed` has the exact shape of GameState
 * with all fields present and all values within their valid enum ranges.
 * Any missing field, wrong type, or out-of-range value returns false.
 * REQ-4 AC-3
 */
export function isValidGameState(parsed: unknown): parsed is GameState {
  if (parsed === null || typeof parsed !== 'object') return false;

  const obj = parsed as Record<string, unknown>;

  // currentScreen must be a known Screen value
  if (!VALID_SCREENS.includes(obj.currentScreen as Screen)) return false;

  // completedRooms must be an integer in [0, 3]
  if (
    typeof obj.completedRooms !== 'number' ||
    !Number.isInteger(obj.completedRooms) ||
    obj.completedRooms < 0 ||
    obj.completedRooms > 3
  ) {
    return false;
  }

  // unlockedRoom must be a valid RoomId (1, 2, or 3)
  if (!VALID_ROOM_IDS.includes(obj.unlockedRoom as RoomId)) return false;

  return true;
}

/**
 * Reads and parses the saved GameState from localStorage.
 * Returns null when the key is absent, the JSON is malformed,
 * or the parsed value does not satisfy isValidGameState.
 * Never throws — all errors are swallowed silently. (REQ-4 AC-3)
 */
export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidGameState(parsed)) return null;
    return parsed;
  } catch {
    // Handles JSON.parse errors, SecurityError, and any other unexpected failures
    return null;
  }
}

/**
 * Serialises and writes the given GameState to localStorage.
 * Silently swallows QuotaExceededError, SecurityError, and any other
 * storage-related exceptions so the game remains playable without persistence.
 * (REQ-4 AC-1)
 */
export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private browsing, quota exceeded, etc.) — continue in memory
  }
}

/**
 * Removes the progress key from localStorage.
 * Called by restartGame() and startGame() to reset persisted progress.
 * (REQ-4 AC-2)
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore any errors — clearing is best-effort
  }
}
