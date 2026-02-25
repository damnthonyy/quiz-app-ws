import type { QuizQuestion } from '../../../../packages/shared-types'

/** Question de quiz reutilisable pour les tests (timerSec: 10, correctIndex: 0) */
export const sampleQuestion: QuizQuestion = {
  id: 'q1',
  text: 'Sample question?',
  choices: ['Choice A', 'Choice B'],
  correctIndex: 0,
  timerSec: 10,
}
