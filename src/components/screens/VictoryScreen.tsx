import { useMemo } from 'react';

interface VictoryScreenProps {
  completedRooms: number; // always 3 when rendered
  onRestart(): void;
}

// Halloween confetti colors
const CONFETTI_COLORS = [
  '#ff6b00', // orange
  '#7b2fbe', // violet
  '#39d353', // green
  '#e8d5ff', // light purple
  '#ff4444', // red
  '#ffd700', // gold
];

// Generate confetti pieces with random positions and delays
function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.floor(Math.random() * 100)}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animationDelay: `${(i * 0.15).toFixed(2)}s`,
    animationDuration: `${2.5 + (i % 5) * 0.3}s`,
    width: `${8 + (i % 4) * 3}px`,
    height: `${8 + (i % 3) * 4}px`,
    borderRadius: i % 3 === 0 ? '50%' : '2px',
  }));
}

export function VictoryScreen({ completedRooms, onRestart }: VictoryScreenProps) {
  // Memoize so confetti positions stay stable across re-renders
  const confettiPieces = useMemo(() => generateConfetti(40), []);

  return (
    <main className="victory-screen">
      {/* Confetti animation layer — fixed position, behind content */}
      <div
        className="confetti-container"
        aria-hidden="true"
      >
        {confettiPieces.map((piece) => (
          <span
            key={piece.id}
            className="confetti-piece"
            style={{
              position: 'fixed',
              left: piece.left,
              top: '-10vh',
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              borderRadius: piece.borderRadius,
              animation: `confettiFall ${piece.animationDuration} ${piece.animationDelay} ease-in forwards`,
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      {/* Victory content — above confetti */}
      <div
        className="victory-content"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="victory-emoji" aria-hidden="true">🎉🏚️🎉</div>

        <h2 className="victory-heading">
          ¡Escapaste de la Mansión Embrujada!
        </h2>

        <p className="victory-message">
          Resolviste los tres desafíos y escapaste de la mansión antes de que
          amaneciera. La oscuridad no pudo contigo esta noche.
        </p>

        <p className="victory-score">
          {completedRooms} de 3 desafíos completados 🏆
        </p>

        <button
          type="button"
          className="btn btn--primary"
          onClick={onRestart}
        >
          Jugar de nuevo
        </button>
      </div>
    </main>
  );
}
