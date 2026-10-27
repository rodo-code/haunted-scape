// Room 3 challenge — numeric code input with symbol display.
// Controlled input; value is preserved on incorrect answer and reset when roomId changes.
// REQ-7, REQ-8 AC-3

import { useState, useEffect } from 'react';
import type { RoomId } from '../../game/types';

interface CryptChallengeProps {
  roomId: RoomId;
  onSubmit(code: string): void;
}

// Symbol groups shown as clues for the numeric code (2-4-1 = "241")
const SYMBOL_GROUPS = [
  { symbol: '🦇', count: 2, label: 'murciélagos' },
  { symbol: '🕯️', count: 4, label: 'velas' },
  { symbol: '💀', count: 1, label: 'calavera' },
];

export function CryptChallenge({ roomId, onSubmit }: CryptChallengeProps) {
  const [value, setValue] = useState('');

  // Reset the input whenever the player advances to a different room (REQ-8 AC-3)
  useEffect(() => {
    setValue('');
  }, [roomId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Pass '' when fewer than 3 characters; the hook returns a validation error.
    onSubmit(value.length < 3 ? '' : value);
  }

  return (
    <form className="crypt-challenge" onSubmit={handleSubmit} noValidate>
      {/* Symbol display — each group shows repeated symbols and a count label */}
      <div className="symbol-groups">
        {SYMBOL_GROUPS.map(({ symbol, count, label }) => (
          <div key={label} className="symbol-group">
            <div className="symbol-row" aria-label={`${count} ${label}`}>
              {Array.from({ length: count }, (_, i) => (
                <span key={i} className="symbol" aria-hidden="true">
                  {symbol}
                </span>
              ))}
            </div>
            <span className="symbol-count">{count}</span>
          </div>
        ))}
      </div>

      <div className="input-group">
        <label htmlFor="crypt-code" className="visually-hidden">
          Código de tres dígitos
        </label>
        <input
          id="crypt-code"
          type="text"
          inputMode="numeric"
          maxLength={3}
          className="challenge-input challenge-input--code"
          value={value}
          onChange={(e) => {
            // Accept only digit characters
            const digits = e.target.value.replace(/\D/g, '');
            setValue(digits);
          }}
          placeholder="_ _ _"
          autoComplete="off"
          autoFocus
        />
      </div>

      <button type="submit" className="btn btn--primary">
        Enviar código
      </button>
    </form>
  );
}
