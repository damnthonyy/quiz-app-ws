// ============================================================
// Host App - Composant principal
// A IMPLEMENTER : gestion des messages et routage par phase
// ============================================================
import { useState, useEffect } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import type { QuizPhase, QuizQuestion, ServerMessage } from '@quiz/shared-types'
import CreateQuiz from './components/CreateQuiz'
import Lobby from './components/Lobby'
import QuestionView from './components/QuestionView'
import Results from './components/Results'
import Leaderboard from './components/Leaderboard'

const WS_URL = 'ws://localhost:3001'

function App() {
  const { status, sendMessage, lastMessage } = useWebSocket(WS_URL)

  // --- Etats de l'application ---
  const [phase, setPhase] = useState<QuizPhase | 'create'>('create')
  const [quizCode, setQuizCode] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Omit<QuizQuestion, 'correctIndex'> | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionTotal, setQuestionTotal] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [answerCount, setAnswerCount] = useState(0)
  const [correctIndex, setCorrectIndex] = useState(-1)
  const [distribution, setDistribution] = useState<number[]>([])
  const [rankings, setRankings] = useState<{ name: string; score: number }[]>([])

  // --- Traitement des messages du serveur ---
  useEffect(() => {
    if (!lastMessage) return

    switch (lastMessage.type) {
      case 'sync': {
        const syncData = lastMessage.data as { quizCode: string; players?: string[] };
        setQuizCode(syncData.quizCode);
        setPlayers(syncData.players || []);
        setPhase(lastMessage.phase)
        break
      }

      case 'joined': {
        setPlayers(lastMessage.players);
        break
      }

      case 'question': {
        setCurrentQuestion(lastMessage.question);
        setQuestionIndex(lastMessage.index);
        setQuestionTotal(lastMessage.total);
        setRemaining(lastMessage.question.timerSec);
        setAnswerCount(0);
        setPhase('question');
        break
      }

      case 'tick': {
        setRemaining(lastMessage.remaining)
        break
      }

      case 'results': {
        setCorrectIndex(lastMessage.correctIndex);
        setDistribution(lastMessage.distribution);

        //Total
        let total = 0;
        for (const votes of lastMessage.distribution) {
          total += votes;
        }
        setAnswerCount(total)
        setPhase('results')
        break
      }

      case 'leaderboard': {
        setRankings(lastMessage.rankings);
        setPhase('leaderboard');
        break
      }

      case 'ended': {
        setPhase('ended');
        break
      }

      case 'error': {
        alert('Erreur: ' + lastMessage.message);
        break
      }
    }
  }, [lastMessage])

  // --- Handlers ---

  /** Appele quand le host soumet le formulaire de creation */
  const handleCreateQuiz = (title: string, questions: QuizQuestion[]) => {
    if (status !== 'connected') {
      alert('Connexion au serveur perdue. Démarrez le serveur sur le port 3001.')
      return
    }
    sendMessage({
      type: 'host:create',
      title,
      questions
    })
  }

  /** Appele quand le host clique sur "Demarrer" dans le lobby */
  const handleStart = () => {
    sendMessage({ type: 'host:start' })
  }

  /** Appele quand le host clique sur "Question suivante" */
  const handleNext = () => {
    sendMessage({ type: 'host:next' })
  }

  // --- Rendu par phase ---
  const renderPhase = () => {
    switch (phase) {
      case 'create':
        return (
          <CreateQuiz
            onSubmit={handleCreateQuiz}
            isConnected={status === 'connected'}
          />
        )

      case 'lobby':
        return (
          <Lobby
            quizCode={quizCode}
            players={players}
            onStart={handleStart}
          />
        )

      case 'question':
        return currentQuestion ? (
          <QuestionView
            question={currentQuestion}
            index={questionIndex}
            total={questionTotal}
            remaining={remaining}
            answerCount={answerCount}
            totalPlayers={players.length}
          />
        ) : null

      case 'results':
        return currentQuestion ? (
          <Results
            correctIndex={correctIndex}
            distribution={distribution}
            choices={currentQuestion.choices}
            onNext={handleNext}
          />
        ) : null

      case 'leaderboard':
        return <Leaderboard rankings={rankings} />

      case 'ended':
        return (
          <div className="phase-container ended-screen">
            <h1>Quiz termine !</h1>
            <p className="ended-message">Merci d'avoir anime ce quiz.</p>
            <div className="ended-actions">
              <button className="btn-primary" onClick={() => setPhase('create')}>
                Retour a l'accueil — Creer un nouveau quiz
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h2>Quiz Host</h2>
        <span className={`status-badge status-${status}`}>
          {status === 'connected' ? 'Connecte' : status === 'connecting' ? 'Connexion...' : 'Deconnecte'}
        </span>
      </header>
      <main className="app-main">
        {renderPhase()}
      </main>
    </div>
  )
}

export default App
