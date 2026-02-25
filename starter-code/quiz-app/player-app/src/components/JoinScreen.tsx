// ============================================================
// JoinScreen - Formulaire pour rejoindre un quiz
// A IMPLEMENTER : champs code et nom, bouton rejoindre
// ============================================================

import { useState } from 'react'

interface JoinScreenProps {
  /** Callback appele quand le joueur soumet le formulaire */
  onJoin: (code: string, name: string) => void
  /** Message d'erreur optionnel (ex: "Code invalide") */
  error?: string
}

/**
 * Composant formulaire pour rejoindre un quiz existant.
 *
 * Ce qu'il faut implementer :
 * - Un champ pour le code du quiz (6 caracteres, majuscules)
 *   avec la classe .code-input pour le style monospace
 * - Un champ pour le pseudo du joueur
 * - Un bouton "Rejoindre" (classe .btn-primary)
 * - Afficher le message d'erreur s'il existe (classe .error-message)
 * - Valider que les deux champs ne sont pas vides avant d'appeler onJoin
 *
 * Classes CSS disponibles : .join-form, .form-group, .code-input,
 * .error-message, .btn-primary
 */
function JoinScreen({ onJoin, error }: JoinScreenProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()
    if (!trimmedCode || !trimmedName) return
    onJoin(trimmedCode, trimmedName)
  }

  return (
    <form className="join-form" onSubmit={handleSubmit}>
      <h1>Rejoindre un Quiz</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label htmlFor="quiz-code">Code du quiz</label>
        <input
          id="quiz-code"
          type="text"
          className="code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXXXX"
          maxLength={6}
        />
      </div>
      <div className="form-group">
        <label htmlFor="player-name">Pseudo</label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre pseudo"
        />
      </div>
      <button type="submit" className="btn-primary">
        Rejoindre
      </button>
    </form>
  )
}

export default JoinScreen
