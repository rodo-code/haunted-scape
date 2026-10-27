// Room 1 challenge — text input form.
// Controlled input; value is preserved on incorrect answer and reset when roomId changes.
// REQ-5, REQ-8 AC-3

import { useState, useEffect } from 'react';
import type { RoomId } from '../../game/types';

interface TextChallengeProps {
  roomId: RoomId;
  riddle: string;
  onSubmit(answer: string): void;
}

export function TextChallenge({ roomId, riddle, onSubmit }: TextChallengeProps) {
  const [value, setValue] = useState('');

  // Reset the input whenever the player advances to a different room (REQ-8 AC-3)
  useEffect(() => {
    setValue('');
  }, [roomId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Pass the current value (may be empty); the hook returns a validation error for ''.
    onSubmit(value);
  }

  return (
    <form className="text-challenge" onSubmit={handleSubmit} noValidate>
      <p className="riddle-text">{riddle}</p>

      <div className="input-group">
        <label htmlFor="text-answer" className="visually-hidden">
          Tu respuesta
        </label>
        <input
          id="text-answer"
          type="text"
          className="challenge-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escribe tu respuesta…"
          autoComplete="off"
          autoFocus
        />
      </div>

      <button type="submit" className="btn btn--primary">
        Enviar respuesta
      </button>
    </form>
  );
}
