import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WebSocket } from 'ws'
import { handleClientMessage, handleClose, type RoutingMaps } from '../routing'
import { QuizRoom } from '../QuizRoom'
import { mockWs } from './helpers/mockWs'
import { sampleQuestion } from './helpers/sampleQuiz'

function getSentMessages(ws: ReturnType<typeof mockWs>): unknown[] {
  return vi.mocked(ws.send).mock.calls.map((call) => JSON.parse(call[0] as string))
}

function createMaps(): RoutingMaps {
  return {
    rooms: new Map(),
    clientRoomMap: new Map(),
    hostRoomMap: new Map(),
  }
}

describe('routing', () => {
  let maps: RoutingMaps

  beforeEach(() => {
    vi.clearAllMocks()
    maps = createMaps()
  })

  describe('host:create', () => {
    it('should create a room and send sync with quizCode to host', () => {
      const hostWs = mockWs()
      handleClientMessage(
        hostWs as unknown as WebSocket,
        { type: 'host:create', title: 'My Quiz', questions: [sampleQuestion] },
        maps
      )
      expect(maps.rooms.size).toBe(1)
      expect(maps.hostRoomMap.has(hostWs as unknown as WebSocket)).toBe(true)
      const room = Array.from(maps.rooms.values())[0]
      expect(room.title).toBe('My Quiz')
      expect(room.questions).toHaveLength(1)
      const messages = getSentMessages(hostWs)
      expect(messages).toContainEqual(
        expect.objectContaining({ type: 'sync', phase: 'lobby', data: { quizCode: room.code } })
      )
    })

    it('should generate unique codes when creating multiple rooms', () => {
      const host1 = mockWs()
      const host2 = mockWs()
      handleClientMessage(
        host1 as unknown as WebSocket,
        { type: 'host:create', title: 'Q1', questions: [] },
        maps
      )
      handleClientMessage(
        host2 as unknown as WebSocket,
        { type: 'host:create', title: 'Q2', questions: [] },
        maps
      )
      expect(maps.rooms.size).toBe(2)
      const codes = Array.from(maps.rooms.keys())
      expect(codes[0]).not.toBe(codes[1])
    })
  })

  describe('join', () => {
    it('should add player to room and store in clientRoomMap when code is valid and phase is lobby', () => {
      const hostWs = mockWs()
      handleClientMessage(
        hostWs as unknown as WebSocket,
        { type: 'host:create', title: 'Quiz', questions: [sampleQuestion] },
        maps
      )
      const room = Array.from(maps.rooms.values())[0]
      const playerWs = mockWs()
      handleClientMessage(
        playerWs as unknown as WebSocket,
        { type: 'join', quizCode: room.code, name: 'Alice' },
        maps
      )
      expect(maps.clientRoomMap.has(playerWs as unknown as WebSocket)).toBe(true)
      expect(room.players.size).toBe(1)
      const messages = getSentMessages(playerWs)
      expect(messages).toContainEqual(
        expect.objectContaining({ type: 'joined', players: ['Alice'] })
      )
    })

    it('should send error when quiz code does not exist', () => {
      const playerWs = mockWs()
      handleClientMessage(
        playerWs as unknown as WebSocket,
        { type: 'join', quizCode: 'INVALID', name: 'Bob' },
        maps
      )
      expect(maps.clientRoomMap.size).toBe(0)
      const messages = getSentMessages(playerWs)
      expect(messages).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Quiz not found' })
      )
    })

    it('should send error when room is not in lobby phase', () => {
      const hostWs = mockWs()
      handleClientMessage(
        hostWs as unknown as WebSocket,
        { type: 'host:create', title: 'Quiz', questions: [sampleQuestion] },
        maps
      )
      const room = Array.from(maps.rooms.values())[0]
      room.addPlayer('First', mockWs() as unknown as WebSocket)
      room.start()
      const playerWs = mockWs()
      handleClientMessage(
        playerWs as unknown as WebSocket,
        { type: 'join', quizCode: room.code, name: 'Late' },
        maps
      )
      const messages = getSentMessages(playerWs)
      expect(messages).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Quiz is not in lobby phase' })
      )
    })
  })

  describe('host:start', () => {
    it('should start room and move to question phase when host sends host:start', () => {
      const hostWs = mockWs()
      handleClientMessage(
        hostWs as unknown as WebSocket,
        { type: 'host:create', title: 'Quiz', questions: [sampleQuestion] },
        maps
      )
      const room = Array.from(maps.rooms.values())[0]
      const playerWs = mockWs()
      handleClientMessage(
        playerWs as unknown as WebSocket,
        { type: 'join', quizCode: room.code, name: 'Alice' },
        maps
      )
      handleClientMessage(hostWs as unknown as WebSocket, { type: 'host:start' }, maps)
      expect(room.phase).toBe('question')
      const hostMessages = getSentMessages(hostWs)
      expect(hostMessages.some((m: unknown) => (m as { type?: string }).type === 'question')).toBe(
        true
      )
    })

    it('should send error when host:start and no room associated', () => {
      const ws = mockWs()
      handleClientMessage(ws as unknown as WebSocket, { type: 'host:start' }, maps)
      const messages = getSentMessages(ws)
      expect(messages).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Room not found' })
      )
    })
  })

  describe('answer', () => {
    it('should send error when answer from unknown client', () => {
      const ws = mockWs()
      handleClientMessage(
        ws as unknown as WebSocket,
        { type: 'answer', questionId: 'q1', choiceIndex: 0 },
        maps
      )
      const messages = getSentMessages(ws)
      expect(messages).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Player not found' })
      )
    })

    it('should process answer and move to results when all players answered', () => {
      const hostWs = mockWs()
      handleClientMessage(
        hostWs as unknown as WebSocket,
        { type: 'host:create', title: 'Quiz', questions: [sampleQuestion] },
        maps
      )
      const room = Array.from(maps.rooms.values())[0]
      const playerWs = mockWs()
      handleClientMessage(
        playerWs as unknown as WebSocket,
        { type: 'join', quizCode: room.code, name: 'Alice' },
        maps
      )
      handleClientMessage(hostWs as unknown as WebSocket, { type: 'host:start' }, maps)
      handleClientMessage(
        playerWs as unknown as WebSocket,
        { type: 'answer', questionId: 'q1', choiceIndex: 0 },
        maps
      )
      expect(room.phase).toBe('results')
      const playerMessages = getSentMessages(playerWs)
      expect(playerMessages.some((m: unknown) => (m as { type?: string }).type === 'results')).toBe(
        true
      )
    })
  })

  describe('host:next', () => {
    it('should send error when host:next and no room associated', () => {
      const ws = mockWs()
      handleClientMessage(ws as unknown as WebSocket, { type: 'host:next' }, maps)
      const messages = getSentMessages(ws)
      expect(messages).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Room not found' })
      )
    })

    it('should advance to next question or leaderboard when host sends host:next', () => {
      const hostWs = mockWs()
      handleClientMessage(
        hostWs as unknown as WebSocket,
        { type: 'host:create', title: 'Quiz', questions: [sampleQuestion] },
        maps
      )
      const room = Array.from(maps.rooms.values())[0]
      room.addPlayer('Alice', mockWs() as unknown as WebSocket)
      handleClientMessage(hostWs as unknown as WebSocket, { type: 'host:start' }, maps)
      handleClientMessage(hostWs as unknown as WebSocket, { type: 'host:next' }, maps)
      expect(room.phase).toBe('leaderboard')
    })
  })

  describe('host:end', () => {
    it('should end room, clean maps and broadcast ended', () => {
      const hostWs = mockWs()
      handleClientMessage(
        hostWs as unknown as WebSocket,
        { type: 'host:create', title: 'Quiz', questions: [sampleQuestion] },
        maps
      )
      const room = Array.from(maps.rooms.values())[0]
      const code = room.code
      handleClientMessage(hostWs as unknown as WebSocket, { type: 'host:end' }, maps)
      expect(maps.rooms.has(code)).toBe(false)
      expect(maps.hostRoomMap.has(hostWs as unknown as WebSocket)).toBe(false)
      const messages = getSentMessages(hostWs)
      expect(messages).toContainEqual(expect.objectContaining({ type: 'ended' }))
    })

    it('should send error when host:end and no room associated', () => {
      const ws = mockWs()
      handleClientMessage(ws as unknown as WebSocket, { type: 'host:end' }, maps)
      const messages = getSentMessages(ws)
      expect(messages).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Room not found' })
      )
    })
  })

  describe('unknown message type', () => {
    it('should send error for unknown message type', () => {
      const ws = mockWs()
      handleClientMessage(
        ws as unknown as WebSocket,
        { type: 'unknown' as 'join', quizCode: '', name: '' },
        maps
      )
      const messages = getSentMessages(ws)
      expect(messages).toContainEqual(
        expect.objectContaining({ type: 'error', message: 'Type de message inconnu' })
      )
    })
  })

  describe('handleClose', () => {
    it('should remove player from clientRoomMap and room on close', () => {
      const hostWs = mockWs()
      handleClientMessage(
        hostWs as unknown as WebSocket,
        { type: 'host:create', title: 'Quiz', questions: [sampleQuestion] },
        maps
      )
      const room = Array.from(maps.rooms.values())[0]
      const playerWs = mockWs()
      handleClientMessage(
        playerWs as unknown as WebSocket,
        { type: 'join', quizCode: room.code, name: 'Alice' },
        maps
      )
      expect(room.players.size).toBe(1)
      handleClose(playerWs as unknown as WebSocket, maps)
      expect(maps.clientRoomMap.has(playerWs as unknown as WebSocket)).toBe(false)
      expect(room.players.size).toBe(0)
    })

    it('should remove host room and clean all players on host close', () => {
      const hostWs = mockWs()
      handleClientMessage(
        hostWs as unknown as WebSocket,
        { type: 'host:create', title: 'Quiz', questions: [sampleQuestion] },
        maps
      )
      const room = Array.from(maps.rooms.values())[0]
      const code = room.code
      const playerWs = mockWs()
      handleClientMessage(
        playerWs as unknown as WebSocket,
        { type: 'join', quizCode: code, name: 'Alice' },
        maps
      )
      handleClose(hostWs as unknown as WebSocket, maps)
      expect(maps.rooms.has(code)).toBe(false)
      expect(maps.hostRoomMap.has(hostWs as unknown as WebSocket)).toBe(false)
      expect(maps.clientRoomMap.has(playerWs as unknown as WebSocket)).toBe(false)
    })
  })
})
