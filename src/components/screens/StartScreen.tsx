// StartScreen — intro narrative + action buttons.
// REQ-1: shows narrative before buttons; conditionally renders Comenzar or Continuar/Nueva partida.
// REQ-1 AC-4: narrative text appears above all action buttons.

interface StartScreenProps {
  hasSavedProgress: boolean;
  onStart(): void;
  onContinue(): void;
  onRestart(): void;
}

export function StartScreen({ hasSavedProgress, onStart, onContinue, onRestart }: StartScreenProps) {
  return (
    <main className="start-screen">
      {/* Narrative text — always rendered above buttons (REQ-1 AC-4) */}
      <div className="start-screen__narrative">
        <div className="start-screen__icon" aria-hidden="true">🏚️</div>

        <h2 className="start-screen__title">La Mansión Embrujada</h2>

        <p className="start-screen__story">
          Es la noche de Halloween y la oscuridad lo envuelve todo. Sin saber cómo ni por qué,{' '}
          despiertas atrapado dentro de la temida <strong>Mansión Embrujada</strong> — sus puertas
          selladas por un antiguo hechizo, sus pasillos llenos de sombras y susurros.
        </p>

        <p className="start-screen__story">
          La única salida está bloqueada por <strong>tres desafíos</strong> que deberás superar uno
          por uno: la misteriosa Biblioteca Maldita, el peligroso Laboratorio de la Bruja y la
          siniestra Cripta Encantada.
        </p>

        <p className="start-screen__story">
          ¿Serás capaz de resolver los enigmas y escapar antes de que el hechizo te atrape para
          siempre? El reloj no existe aquí... solo tu ingenio puede salvarte. 🕯️
        </p>
      </div>

      {/* Action buttons — rendered below narrative in all cases */}
      <div className="start-screen__actions">
        {hasSavedProgress ? (
          /* REQ-1 AC-2: Continuar restores saved state; AC-3: Nueva partida clears progress */
          <>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onContinue}
            >
              Continuar
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onRestart}
            >
              Nueva partida
            </button>
          </>
        ) : (
          /* REQ-1 AC-1: Comenzar navigates to Room 1 with progress at 0/3 */
          <button
            type="button"
            className="btn btn--primary"
            onClick={onStart}
          >
            Comenzar
          </button>
        )}
      </div>
    </main>
  );
}
