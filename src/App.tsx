// App root — screen routing driven entirely by useGameState().
// No URL changes, no browser history entries. Navigation is a pure state update.
// REQ-2 (sequential room access), REQ-3 (progress indicator always visible).

import { useGameState } from './game/useGameState';
import { ROOMS } from './game/rooms';

import { Layout } from './components/layout/Layout';
import { Header } from './components/layout/Header';

import { StartScreen } from './components/screens/StartScreen';
import { RoomScreen } from './components/screens/RoomScreen';
import { VictoryScreen } from './components/screens/VictoryScreen';

function App() {
  const {
    screen,
    completedRooms,
    hasSavedProgress,
    startGame,
    continueGame,
    submitAnswer,
    restartGame,
  } = useGameState();

  return (
    <Layout>
      {/* Header with progress indicator is unconditionally rendered above every screen — REQ-3 */}
      <Header completedRooms={completedRooms} />

      {screen === 'start' && (
        <StartScreen
          hasSavedProgress={hasSavedProgress}
          onStart={startGame}
          onContinue={continueGame}
          onRestart={restartGame}
        />
      )}

      {screen === 'room-1' && (
        <RoomScreen
          roomId={1}
          room={ROOMS[1]}
          onSubmit={submitAnswer}
          onAdvance={() => { /* advance is handled inside RoomScreen via submitAnswer result */ }}
        />
      )}

      {screen === 'room-2' && (
        <RoomScreen
          roomId={2}
          room={ROOMS[2]}
          onSubmit={submitAnswer}
          onAdvance={() => { /* advance is handled inside RoomScreen via submitAnswer result */ }}
        />
      )}

      {screen === 'room-3' && (
        <RoomScreen
          roomId={3}
          room={ROOMS[3]}
          onSubmit={submitAnswer}
          onAdvance={() => { /* advance is handled inside RoomScreen via submitAnswer result */ }}
        />
      )}

      {screen === 'victory' && (
        <VictoryScreen
          completedRooms={completedRooms}
          onRestart={restartGame}
        />
      )}
    </Layout>
  );
}

export default App;
