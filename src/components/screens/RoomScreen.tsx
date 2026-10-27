// Generic room wrapper shared by all three rooms.
// Owns local UI state only (feedbackState, hintVisible) — never persisted.
// REQ-2, REQ-5, REQ-6, REQ-7, REQ-8, REQ-9

import { useState, useEffect, useRef } from 'react';
import type { RoomId, RoomDefinition, SubmitResult } from '../../game/types';
import { FeedbackMessage } from '../shared/FeedbackMessage';
import { HintButton } from '../shared/HintButton';
import { TextChallenge } from '../challenges/TextChallenge';
import { PotionChallenge } from '../challenges/PotionChallenge';
import { CryptChallenge } from '../challenges/CryptChallenge';

interface RoomScreenProps {
  roomId: RoomId;
  room: RoomDefinition;
  onSubmit(roomId: RoomId, answer: string | null): SubmitResult;
  onAdvance(): void;
}

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
} | null;

export function RoomScreen({ roomId, room, onSubmit, onAdvance }: RoomScreenProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(null);
  const [hintVisible, setHintVisible] = useState(false);

  // Ref to hold the advance timer so we can clean it up on unmount (design.md §Notes)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local UI state when the room changes (REQ-9 AC-3)
  useEffect(() => {
    setFeedbackState(null);
    setHintVisible(false);

    // Cancel any pending advance timer from the previous room
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, [roomId]);

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  function handleChallengeSubmit(answer: string | null) {
    const result = onSubmit(roomId, answer);

    if (result.correct) {
      // REQ-8 AC-1: show success feedback, then advance after 1 500 ms
      setFeedbackState({ type: 'success', message: '¡Correcto! Avanzando a la siguiente habitación…' });
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        onAdvance();
      }, 1500);
    } else {
      // REQ-8 AC-2: show error feedback; input value is preserved by the challenge component
      // Narrow the discriminated union — result.correct is false here
      const errorResult = result as { correct: false; message: string };
      setFeedbackState({ type: 'error', message: errorResult.message });
    }
  }

  function renderChallenge() {
    switch (room.challengeType) {
      case 'text':
        return (
          <TextChallenge
            roomId={roomId}
            riddle={room.description}
            onSubmit={handleChallengeSubmit}
          />
        );
      case 'potion':
        return (
          <PotionChallenge
            roomId={roomId}
            onSubmit={handleChallengeSubmit}
          />
        );
      case 'crypt':
        return (
          <CryptChallenge
            roomId={roomId}
            onSubmit={handleChallengeSubmit}
          />
        );
    }
  }

  return (
    <main className="room-screen">
      <div className="room-card">
        {/* Room header */}
        <header className="room-header">
          <span className="room-emoji" aria-hidden="true">{room.emoji}</span>
          <h2 className="room-title">{room.title}</h2>
        </header>

        {/* Narrative description — only rendered for potion and crypt rooms;
            TextChallenge renders the riddle itself as part of the form */}
        {room.challengeType !== 'text' && (
          <p className="room-description">{room.description}</p>
        )}

        {/* Hint toggle (REQ-9) */}
        <HintButton
          hint={room.hint}
          visible={hintVisible}
          onToggle={() => setHintVisible((v) => !v)}
        />

        {/* Challenge component for this room */}
        {renderChallenge()}

        {/* Feedback message — shown only after a submit attempt (REQ-8) */}
        {feedbackState !== null && (
          <FeedbackMessage
            type={feedbackState.type}
            message={feedbackState.message}
          />
        )}
      </div>
    </main>
  );
}
