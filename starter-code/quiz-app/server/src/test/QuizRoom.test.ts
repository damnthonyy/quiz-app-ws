import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuizRoom } from '../QuizRoom'
import { mockWs } from './helpers/mockWs'
import { sampleQuestion } from './helpers/sampleQuiz'

/** Retourne les messages envoyes via ws.send (le serveur envoie du JSON stringifie) */
function getSentMessages(ws: ReturnType<typeof mockWs>): unknown[] {
  return vi.mocked(ws.send).mock.calls.map((call) => JSON.parse(call[0] as string))
}

describe('QuizRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a new quiz room', () => {
    const room = new QuizRoom('123', 'ABC123')
    expect(room).toBeDefined()
    expect(room.phase).toBe('lobby')
  })

  it('should add a player to the quiz room', () => {
    const room = new QuizRoom('123', 'ABC123')
    const ws = mockWs()
    const playerId = room.addPlayer('Alice', ws)
    expect(playerId).toBeDefined()
    expect(room.players.size).toBe(1)
    expect(room.scores.get(playerId)).toBe(0)
    const messages = getSentMessages(ws)
    expect(messages).toContainEqual(
      expect.objectContaining({ type: 'joined', playerId, players: ['Alice'] })
    )
  })

  it('should start the quiz when in lobby with at least one player and questions', () => {
    const room = new QuizRoom('123', 'ABC123')
    room.questions = [sampleQuestion]
    const ws = mockWs()
    room.addPlayer('Alice', ws)
    room.start()
    expect(room.phase).toBe('question')
    const messages = getSentMessages(ws)
    expect(messages).toContainEqual(
      expect.objectContaining({
        type: 'question',
        question: expect.objectContaining({ id: 'q1', text: 'Sample question?' }),
        index: 0,
        total: 1,
      })
    )
  })

  it('should handle an answer from a player and move to results when everyone answered', () => {
    const room = new QuizRoom('123', 'ABC123')
    room.questions = [sampleQuestion]
    const ws = mockWs()
    const playerId = room.addPlayer('Alice', ws)
    room.start()
    room.handleAnswer(playerId, 0)
    expect(room.phase).toBe('results')
  })

  it('should broadcast results after everyone answered (via public API)', () => {
    const room = new QuizRoom('123', 'ABC123')
    room.questions = [sampleQuestion]
    const ws = mockWs()
    const playerId = room.addPlayer('Alice', ws)
    room.start()
    room.handleAnswer(playerId, 0)
    const messages = getSentMessages(ws)
    expect(messages).toContainEqual(
      expect.objectContaining({
        type: 'results',
        correctIndex: 0,
        distribution: [1, 0],
        scores: expect.objectContaining({ Alice: expect.any(Number) }),
      })
    )
  })

  it('should broadcast the leaderboard to all players', () => {
    const room = new QuizRoom('123', 'ABC123')
    room.questions = [sampleQuestion]
    const ws = mockWs()
    room.addPlayer('Alice', ws)
    room.start()
    room.broadcastLeaderboard()
    expect(room.phase).toBe('leaderboard')
    const messages = getSentMessages(ws)
    expect(messages).toContainEqual(
      expect.objectContaining({
        type: 'leaderboard',
        rankings: expect.arrayContaining([expect.objectContaining({ name: 'Alice', score: 0 })]),
      })
    )
  })

  it('should end the quiz room', () => {
    const room = new QuizRoom('123', 'ABC123')
    room.questions = [sampleQuestion]
    const ws = mockWs()
    room.addPlayer('Alice', ws)
    room.start()
    room.end()
    expect(room.phase).toBe('ended')
  })

  it('should broadcast the ended message to all players', () => {
    const room = new QuizRoom('123', 'ABC123')
    room.questions = [sampleQuestion]
    const ws = mockWs()
    room.addPlayer('Alice', ws)
    room.start()
    room.end()
    const messages = getSentMessages(ws)
    expect(messages).toContainEqual(expect.objectContaining({ type: 'ended' }))
  })

  it('should broadcast tick when timer advances (via start and fake timers)', () => {
    vi.useFakeTimers()
    const room = new QuizRoom('123', 'ABC123')
    room.questions = [sampleQuestion]
    const ws = mockWs()
    room.addPlayer('Alice', ws)
    room.start()
    vi.advanceTimersByTime(1000)
    const messages = getSentMessages(ws)
    expect(messages).toContainEqual(expect.objectContaining({ type: 'tick', remaining: 9 }))
    vi.useRealTimers()
  })
})
