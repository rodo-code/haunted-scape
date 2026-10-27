// Screen identifiers for the game's state machine
export type Screen = 'start' | 'room-1' | 'room-2' | 'room-3' | 'victory';

// Room identifiers — there are exactly three rooms
export type RoomId = 1 | 2 | 3;

// The type of challenge each room presents
export type ChallengeType = 'text' | 'potion' | 'crypt';

// Central game state — the only structure persisted to localStorage
export interface GameState {
  currentScreen: Screen;  // active screen; drives rendering in App.tsx
  completedRooms: number; // 0–3; incremented on each correct answer
  unlockedRoom: RoomId;   // highest room the player may access (REQ-2)
}

// Static room data — never mutated at runtime
export interface RoomDefinition {
  id: RoomId;
  title: string;          // e.g. "Biblioteca Maldita"
  emoji: string;          // decorative room emoji
  description: string;    // narrative text shown above the challenge
  hint: string;           // shown when player requests it (REQ-9)
  challengeType: ChallengeType;
}

// Return value of submitAnswer — used by components to render feedback
export type SubmitResult =
  | { correct: true }
  | { correct: false; message: string };
