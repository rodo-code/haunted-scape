// Room 2 challenge — three selectable potion cards + confirm button.
// Controlled selection; preserved on incorrect answer, reset when roomId changes.
// REQ-6, REQ-8 AC-3

import { useState, useEffect } from 'react';
import type { RoomId } from '../../game/types';

type PotionColor = 'roja' | 'morada' | 'verde';

const POTIONS: { color: PotionColor; label: string; emoji: string }[] = [
  { color: 'roja',   label: 'Poción Roja',   emoji: '🔴' },
  { color: 'morada', label: 'Poción Morada', emoji: '🟣' },
  { color: 'verde',  label: 'Poción Verde',  emoji: '🟢' },
];

interface PotionChallengeProps {
  roomId: RoomId;
  onSubmit(selection: string | null): void;
}

export function PotionChallenge({ roomId, onSubmit }: PotionChallengeProps) {
  const [selected, setSelected] = useState<PotionColor | null>(null);

  // Reset selection whenever the player advances to a different room (REQ-8 AC-3)
  useEffect(() => {
    setSelected(null);
  }, [roomId]);

  function handleConfirm() {
    // Pass null when nothing is selected; the hook returns a validation error.
    onSubmit(selected);
  }

  return (
    <div className="potion-challenge">
      <div className="potion-grid">
        {POTIONS.map(({ color, label, emoji }) => (
          <button
            key={color}
            type="button"
            className={`potion-card potion--${color}${selected === color ? ' potion-card--selected' : ''}`}
            aria-pressed={selected === color}
            onClick={() => setSelected(color)}
          >
            <span className="potion-emoji" aria-hidden="true">
              {emoji}
            </span>
            <span className="potion-label">{label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn--primary"
        onClick={handleConfirm}
      >
        Confirmar
      </button>
    </div>
  );
}
