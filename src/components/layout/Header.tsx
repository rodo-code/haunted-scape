import { ProgressBar } from '../shared/ProgressBar';

interface HeaderProps {
  completedRooms: number; // 0–3
}

export function Header({ completedRooms }: HeaderProps) {
  return (
    <header className="site-header">
      <h1 className="site-title">🏚️ Haunted Escape</h1>
      <ProgressBar completedRooms={completedRooms} />
    </header>
  );
}
