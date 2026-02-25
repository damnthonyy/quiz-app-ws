// ============================================================
// Logique de routage des messages WebSocket (extrait pour tests)
// ============================================================

import type { WebSocket } from 'ws'
import type { ClientMessage } from '@quiz/shared-types'
import { QuizRoom } from './QuizRoom'
import { send, generateQuizCode } from './utils'

export interface RoutingMaps {
  rooms: Map<string, QuizRoom>
  clientRoomMap: Map<WebSocket, { room: QuizRoom; playerId: string }>
  hostRoomMap: Map<WebSocket, QuizRoom>
}

/**
 * Traite un message client (apres parsing JSON).
 * Utilise par index.ts et par les tests de routage.
 */
export function handleClientMessage(
  ws: WebSocket,
  message: ClientMessage,
  maps: RoutingMaps
): void {
  const { rooms, clientRoomMap, hostRoomMap } = maps

  switch (message.type) {
    case 'join': {
      const room = rooms.get(message.quizCode)
      if (!room) {
        send(ws, { type: 'error', message: 'Quiz not found' })
        return
      }
      if (room.phase !== 'lobby') {
        send(ws, { type: 'error', message: 'Quiz is not in lobby phase' })
        return
      }
      const playerId = room.addPlayer(message.name, ws)
      clientRoomMap.set(ws, { room, playerId })
      break
    }

    case 'answer': {
      const entry = clientRoomMap.get(ws)
      if (!entry) {
        send(ws, { type: 'error', message: 'Player not found' })
        return
      }
      try {
        entry.room.handleAnswer(entry.playerId, message.choiceIndex)
      } catch {
        send(ws, { type: 'error', message: 'Invalid answer or phase' })
      }
      break
    }

    case 'host:create': {
      let code: string
      do {
        code = generateQuizCode()
      } while (rooms.has(code))
      const room = new QuizRoom(Date.now().toString(), code)
      room.hostWs = ws
      room.title = message.title
      room.questions = message.questions
      rooms.set(code, room)
      hostRoomMap.set(ws, room)
      send(ws, { type: 'sync', phase: 'lobby', data: { quizCode: code } })
      break
    }

    case 'host:start': {
      const room = hostRoomMap.get(ws)
      if (!room) {
        send(ws, { type: 'error', message: 'Room not found' })
        return
      }
      try {
        room.start()
      } catch {
        send(ws, { type: 'error', message: 'Cannot start quiz' })
      }
      break
    }

    case 'host:next': {
      const room = hostRoomMap.get(ws)
      if (!room) {
        send(ws, { type: 'error', message: 'Room not found' })
        return
      }
      room.nextQuestion()
      break
    }

    case 'host:end': {
      const room = hostRoomMap.get(ws)
      if (!room) {
        send(ws, { type: 'error', message: 'Room not found' })
        return
      }
      room.end()
      for (const player of room.players.values()) {
        clientRoomMap.delete(player.ws)
      }
      hostRoomMap.delete(ws)
      rooms.delete(room.code)
      break
    }

    default: {
      send(ws, { type: 'error', message: 'Type de message inconnu' })
    }
  }
}

/**
 * Nettoie les maps a la deconnexion d'un client.
 */
export function handleClose(ws: WebSocket, maps: RoutingMaps): void {
  const { rooms, clientRoomMap, hostRoomMap } = maps

  const entry = clientRoomMap.get(ws)
  if (entry) {
    entry.room.players.delete(entry.playerId)
    clientRoomMap.delete(ws)
  }

  const hostRoom = hostRoomMap.get(ws)
  if (hostRoom) {
    hostRoom.end()
    for (const player of hostRoom.players.values()) {
      clientRoomMap.delete(player.ws)
    }
    hostRoomMap.delete(ws)
    rooms.delete(hostRoom.code)
  }
}
