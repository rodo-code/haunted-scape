interface HintButtonProps {
  hint: string;
  visible: boolean;
  onToggle(): void;
}

export function HintButton({ hint, visible, onToggle }: HintButtonProps) {
  return (
    <div className="hint-container">
      <button
        type="button"
        className="btn btn--secondary btn--hint"
        onClick={onToggle}
        aria-expanded={visible}
      >
        {visible ? 'Ocultar pista' : 'Ver pista'}
      </button>
      {visible && (
        <p className="hint-text">{hint}</p>
      )}
    </div>
  );
}
