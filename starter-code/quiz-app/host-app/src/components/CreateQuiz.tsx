// ============================================================
// CreateQuiz - Formulaire de creation d'un quiz
// A IMPLEMENTER : construire le formulaire dynamique
// ============================================================

import { useState } from 'react'
import type { QuizQuestion } from '@quiz/shared-types'

interface CreateQuizProps {
  /** Callback appele quand le formulaire est soumis */
  onSubmit: (title: string, questions: QuizQuestion[]) => void
}

/**
 * Composant formulaire pour creer un nouveau quiz.
 *
 * Ce qu'il faut implementer :
 * - Un champ pour le titre du quiz
 * - Une liste dynamique de questions (pouvoir en ajouter/supprimer)
 * - Pour chaque question :
 *   - Un champ texte pour la question
 *   - 4 champs texte pour les choix de reponse
 *   - Un selecteur (radio) pour la bonne reponse (correctIndex)
 *   - Un champ pour la duree du timer en secondes
 * - Un bouton pour ajouter une question
 * - Un bouton pour soumettre le formulaire
 *
 * Astuce : utilisez un state pour stocker un tableau de questions
 * et generez un id unique pour chaque question (ex: crypto.randomUUID())
 *
 * Classes CSS disponibles : .create-form, .form-group, .question-card,
 * .question-card-header, .choices-inputs, .choice-input-group,
 * .btn-add-question, .btn-remove, .btn-primary
 */
function CreateQuiz({ onSubmit }: CreateQuizProps) {
  // TODO: State pour le titre
  // TODO: State pour la liste des questions
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      text: '',
      choices: ['', '', '', ''],
      correctIndex: 0,
      timerSec: 15
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, field: keyof Omit<QuizQuestion, 'id'>, value: string | number) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const updateChoice = (id: string, choiceIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        const newChoices = [...q.choices]
        newChoices[choiceIndex] = value
        return { ...q, choices: newChoices }
      }
      return q
    }))
  }

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Valider que le titre n'est pas vide
    // TODO: Valider qu'il y a au moins 1 question
    // TODO: Valider que chaque question a un texte et 4 choix non-vides
    // TODO: Appeler onSubmit(title, questions)
    // Validation
    if (!title.trim()) {
      alert('Titre requis')
      return
    }
    if (questions.length === 0) {
      alert('Au moins 1 question requise')
      return
    }
    
    // Validation questions
    const validQuestions = questions.filter(q => 
      q.text.trim() && 
      q.choices.every(c => c.trim()) &&
      q.choices[q.correctIndex].trim()
    )
    
    if (validQuestions.length !== questions.length) {
      alert('Toutes les questions doivent être complètes')
      return
    }
    
    onSubmit(title, questions)
  }

  return (
    <div className="phase-container">
      <h1>Creer un Quiz</h1>
      <form className="create-form" onSubmit={handleSubmit}>
        {/* Titre */}
        <div className="form-group">
          <label>Titre du quiz :</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entrez le titre de votre quiz"
            className="form-input"
          />
        </div>

        {/* Liste questions */}
        <div className="questions-list">
          {questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-card-header">
                <h3>Question {index + 1}</h3>
                <button 
                  type="button" 
                  className="btn-remove"
                  onClick={() => deleteQuestion(question.id)}
                >
                  Supprimer
                </button>
              </div>

              {/* Texte question */}
              <div className="form-group">
                <label htmlFor={`q${question.id}-text`}>Question :</label>
                <input
                  id={`q${question.id}-text`}
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                  placeholder="Posez votre question"
                />
              </div>

              {/* Choix réponses */}
              <div className="form-group">
                <label>Choix de réponse :</label>
                <div className="choices-inputs">
                  {question.choices.map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="choice-input-group">
                      <input
                        type="radio"
                        id={`q${question.id}-c${choiceIndex}`}
                        name={`correct-${question.id}`}
                        checked={question.correctIndex === choiceIndex}
                        onChange={() => updateQuestion(question.id, 'correctIndex', choiceIndex)}
                      />
                      <label htmlFor={`q${question.id}-c${choiceIndex}`}>
                        {String.fromCharCode(65 + choiceIndex)} {/* A, B, C, D */}
                      </label>
                      <input
                        value={choice}
                        onChange={(e) => updateChoice(question.id, choiceIndex, e.target.value)}
                        placeholder={`Choix ${String.fromCharCode(65 + choiceIndex)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="form-group">
                <label htmlFor={`q${question.id}-timer`}>Durée (secondes) :</label>
                <input
                  id={`q${question.id}-timer`}
                  type="number"
                  min="5"
                  max="60"
                  value={question.timerSec}
                  onChange={(e) => updateQuestion(question.id, 'timerSec', parseInt(e.target.value))}
                  placeholder="Durée en secondes"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-add-question"
            onClick={addQuestion}
          >
            + Ajouter une question
          </button>
          <button type="submit" className="btn-primary">
            Créer le Quiz
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateQuiz