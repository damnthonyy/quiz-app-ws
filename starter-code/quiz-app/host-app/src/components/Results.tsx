// ============================================================
// Results - Affichage des resultats d'une question
// A IMPLEMENTER : barres animees et bonne reponse
// ============================================================

interface ResultsProps {
  /** Index de la bonne reponse (0-3) */
  correctIndex: number
  /** Distribution des reponses [nb_choix_0, nb_choix_1, nb_choix_2, nb_choix_3] */
  distribution: number[]
  /** Texte des choix de reponse */
  choices: string[]
  /** Callback quand le host clique sur "Question suivante" */
  onNext: () => void
}

/**
 * Composant affichant les resultats d'une question avec des barres animees.
 *
 * Ce qu'il faut implementer :
 * - Un titre "Resultats"
 * - Pour chaque choix, une barre horizontale proportionnelle au nombre de reponses
 *   (classes .result-bar-container, .result-bar-label, .result-bar-wrapper, .result-bar)
 *   La barre correcte a la classe .correct, les autres .incorrect
 *   Afficher un label "(Bonne reponse)" a cote du bon choix (classe .correct-label)
 * - La largeur de la barre est proportionnelle :
 *   width = `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`
 * - Un bouton "Question suivante" (classe .btn-primary)
 *
 * Astuce : const maxCount = Math.max(...distribution, 1)
 */
function Results({ correctIndex, distribution, choices, onNext }: ResultsProps) {
    // Max pour % largeur (évite division par 0)
  const maxCount = Math.max(...distribution, 1)
  return (
    <div className="phase-container">
      <div className="results-container">
        <h1>Resultats</h1>
        {/* TODO: Pour chaque choix, afficher une barre de resultat */}
        {/* TODO: Utiliser .result-bar.correct pour la bonne reponse */}
        {/* TODO: Calculer la largeur proportionnelle de chaque barre */}
        {/* TODO: Afficher le nombre de reponses dans chaque barre */}
        {/* TODO: Bouton "Question suivante" */}
        {/* 4 barres de résultats */}
        {distribution.map((count, index) => {
          const isCorrect = index === correctIndex
          const width = `${(count / maxCount) * 100}%`
          
          return (
            <div key={index} className="result-bar-container">
              {/* Label A) choix (Bonne réponse) */}
              <div className="result-bar-label">
                <strong>{String.fromCharCode(65 + index)}</strong> {choices[index]}
                {isCorrect && <span className="correct-label"> (Bonne réponse)</span>}
              </div>
              
              {/* Barre */}
              <div className="result-bar-wrapper">
                <div 
                  className={`result-bar ${isCorrect ? 'correct' : 'incorrect'}`}
                  style={{ width }}
                >
                  <span>{count}</span>
                </div>
              </div>
            </div>
          )
        })}

        {/* Next */}
        <button className="btn-primary" onClick={onNext}>
          Question suivante
        </button>
      </div>
    </div>
  )
}

export default Results
