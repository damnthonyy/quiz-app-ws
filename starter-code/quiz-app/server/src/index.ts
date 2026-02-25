// ============================================================
// Serveur WebSocket - Point d'entree
// ============================================================

import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import type { ClientMessage } from '../../packages/shared-types'
import { send } from './utils'
import { handleClientMessage, handleClose, type RoutingMaps } from './routing'
import type { QuizRoom } from './QuizRoom'

const PORT = 3001

// ---- Stockage global des salles ----
const rooms = new Map<string, QuizRoom>()
const clientRoomMap = new Map<WebSocket, { room: QuizRoom; playerId: string }>()
const hostRoomMap = new Map<WebSocket, QuizRoom>()

const maps: RoutingMaps = { rooms, clientRoomMap, hostRoomMap }

// ---- Creation du serveur HTTP + WebSocket ----
const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Quiz WebSocket Server is running')
})

const wss = new WebSocketServer({ server: httpServer })

console.log(`[Server] Demarrage sur le port ${PORT}...`)

wss.on('connection', (ws: WebSocket) => {
  console.log('[Server] Nouvelle connexion WebSocket')

  ws.on('message', (raw: Buffer) => {
    let message: ClientMessage
    try {
      message = JSON.parse(raw.toString()) as ClientMessage
    } catch {
      send(ws, { type: 'error', message: 'Message JSON invalide' })
      return
    }

    console.log('[Server] Message recu:', message.type)
    handleClientMessage(ws, message, maps)
  })

  ws.on('close', () => {
    console.log('[Server] Connexion fermee')
    handleClose(ws, maps)
  })

  ws.on('error', (err: Error) => {
    console.error('[Server] Erreur WebSocket:', err.message)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[Server] Serveur WebSocket demarre sur ws://localhost:${PORT}`)
})
