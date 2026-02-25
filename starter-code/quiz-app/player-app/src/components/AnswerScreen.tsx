// ============================================================
// AnswerScreen - Boutons de reponse colores
// A IMPLEMENTER : question, timer, 4 boutons colores
// ============================================================

import { useState } from 'react'
import type { QuizQuestion } from '@quiz/shared-types'

interface AnswerScreenProps {
  /** La question en cours (sans correctIndex) */
  question: Omit<QuizQuestion, 'correctIndex'>
  /** Temps restant en secondes */
  remaining: number
  /** Callback quand le joueur clique sur un choix */
  onAnswer: (choiceIndex: number) => void
  /** Si true, le joueur a deja repondu */
  hasAnswered: boolean
}

/**
 * Composant affichant la question et les boutons de reponse colores.
 *
 * Ce qu'il faut implementer :
 * - Le temps restant (classe .answer-timer)
 *   Ajouter la classe .warning si remaining <= 10, .danger si remaining <= 3
 * - Le texte de la question (classe .answer-question)
 * - 4 boutons colores dans une grille (classes .answer-grid, .answer-btn)
 *   Les couleurs sont gerees automatiquement par :nth-child dans le CSS
 * - Tous les boutons sont desactives (disabled) si hasAnswered est true
 * - Optionnel : ajouter la classe .selected au bouton choisi
 * - Si le joueur a repondu, afficher "Reponse envoyee !" (classe .answered-message)
 *
 * Classes CSS disponibles : .answer-screen, .answer-timer, .warning, .danger,
 * .answer-question, .answer-grid, .answer-btn, .selected, .answered-message
 */
function AnswerScreen({ question, remaining, onAnswer, hasAnswered }: AnswerScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  const handleClick = (index: number) => {
    if (hasAnswered) return
    setSelectedIndex(index)
    onAnswer(index)
  }

  const timerClass = `answer-timer ${remaining <= 10 ? 'warning' : ''} ${remaining <= 3 ? 'danger' : ''}`.trim()

  return (
    <div className="answer-screen">
      <div className={timerClass}>{remaining}s</div>
      <p className="answer-question">{question.text}</p>
      <div className="answer-grid">
        {question.choices.map((choice, index) => (
          <button
            key={index}
            type="button"
            className={`answer-btn ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => handleClick(index)}
            disabled={hasAnswered}
          >
            {choice}
          </button>
        ))}
      </div>
      {hasAnswered && <p className="answered-message">Réponse envoyée !</p>}
    </div>
  )
}

export default AnswerScreen
