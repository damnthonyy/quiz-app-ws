// ============================================================
// Lobby - Salle d'attente avant le quiz
// A IMPLEMENTER : affichage du code et liste des joueurs
// ============================================================

interface LobbyProps {
  /** Code du quiz a afficher pour que les joueurs rejoignent */
  quizCode: string
  /** Liste des noms de joueurs connectes */
  players: string[]
  /** Callback quand le host clique sur "Demarrer" */
  onStart: () => void
}

/**
 * Composant salle d'attente affiche cote host.
 *
 * Ce qu'il faut implementer :
 * - Le code du quiz affiche en grand (classe .quiz-code) avec le label "Code du quiz"
 * - Le nombre de joueurs connectes
 * - La liste des joueurs (puces avec classe .player-chip dans un .player-list)
 * - Un bouton "Demarrer le quiz" (classe .btn-start)
 *   desactive s'il n'y a aucun joueur
 *
 * Classes CSS disponibles : .phase-container, .quiz-code-label, .quiz-code,
 * .player-count, .player-list, .player-chip, .btn-start
 */
function Lobby({ quizCode, players, onStart }: LobbyProps) {
  const hasPlayers = players.length > 0
  return (
    <div className="phase-container">
      {/* TODO: Label "Code du quiz" avec classe .quiz-code-label */}
      {/* TODO: Afficher quizCode avec classe .quiz-code */}
      {/* TODO: Afficher le nombre de joueurs */}
      {/* TODO: Liste des joueurs avec .player-list et .player-chip */}
      {/* TODO: Bouton Demarrer avec classe .btn-start, desactive si 0 joueurs */}
      {/* Code quiz GRAND */}
      <div className="quiz-code-label">Code du quiz</div>
      <div className="quiz-code">{quizCode.toUpperCase()}</div>

      {/* Compteur joueurs */}
      <div className="player-count">
        {players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''}
      </div>

      {/* Liste joueurs */}
      <div className="player-list">
        {players.map((player) => (
          <div key={player} className="player-chip">
            {player}
          </div>
        ))}
      </div>

      {/* Bouton START */}
      <button
        className="btn-start"
        onClick={onStart}
        disabled={!hasPlayers}
      >
        Démarrer le quiz
      </button>
    </div>
  )
}

export default Lobby
