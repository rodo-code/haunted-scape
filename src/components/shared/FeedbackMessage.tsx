interface FeedbackMessageProps {
  type: 'success' | 'error';
  message: string;
}

export function FeedbackMessage({ type, message }: FeedbackMessageProps) {
  return (
    <div role="alert" className={`feedback feedback--${type}`}>
      <span className="feedback__icon">{type === 'success' ? '✅' : '❌'}</span>
      <span className="feedback__text">{message}</span>
    </div>
  );
}
