interface ProgressBarProps {
  completedRooms: number; // 0–3
}

const PIP_COUNT = 3;

export function ProgressBar({ completedRooms }: ProgressBarProps) {
  return (
    <div
      className="progress-bar"
      aria-label={`${completedRooms} de 3 desafíos completados`}
    >
      {Array.from({ length: PIP_COUNT }, (_, i) => {
        const filled = i < completedRooms;
        return (
          <span
            key={i}
            className={`progress-pip${filled ? ' progress-pip--filled' : ''}`}
            style={{
              backgroundColor: filled
                ? 'var(--color-accent-orange)'
                : 'var(--color-text-muted)',
            }}
          />
        );
      })}
    </div>
  );
}
