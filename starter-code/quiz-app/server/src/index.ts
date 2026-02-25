// ============================================================
// Serveur WebSocket - Point d'entree
// A IMPLEMENTER : remplir les cas du switch avec la logique
// ============================================================

import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import type { ClientMessage, QuizQuestion } from '../../packages/shared-types'
import { QuizRoom } from './QuizRoom'
import { send, generateQuizCode } from './utils'

const PORT = 3001

// ---- Stockage global des salles ----
/** Map des salles : code du quiz -> QuizRoom */
const rooms = new Map<string, QuizRoom>()

/** Map inverse pour retrouver la salle d'un joueur : WebSocket -> { room, playerId } */
const clientRoomMap = new Map<WebSocket, { room: QuizRoom; playerId: string }>()

/** Map pour retrouver la salle du host : WebSocket -> QuizRoom */
const hostRoomMap = new Map<WebSocket, QuizRoom>()

// ---- Creation du serveur HTTP + WebSocket ----
const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Quiz WebSocket Server is running')
})

const wss = new WebSocketServer({ server: httpServer })

console.log(`[Server] Demarrage sur le port ${PORT}...`)

// ---- Gestion des connexions WebSocket ----
wss.on('connection', (ws: WebSocket) => {
  console.log('[Server] Nouvelle connexion WebSocket')

  ws.on('message', (raw: Buffer) => {
    // --- Parsing du message JSON ---
    let message: ClientMessage
    try {
      message = JSON.parse(raw.toString()) as ClientMessage
    } catch {
      send(ws, { type: 'error', message: 'Message JSON invalide' })
      return
    }

    console.log('[Server] Message recu:', message.type)

    // --- Routage par type de message ---
    switch (message.type) {
      // ============================================================
      // Un joueur veut rejoindre un quiz
      // ============================================================
      case 'join': {
        // TODO: Recuperer la salle avec message.quizCode depuis la map rooms
        const room = rooms.get(message.quizCode)
        // TODO: Si la salle n'existe pas, envoyer une erreur
        if (!room) {
          send(ws, { type:'error', message: 'Quiz not found' })
          return
        }
        // TODO: Si la salle n'est pas en phase 'lobby', envoyer une erreur
        if (room.phase !== 'lobby') {
          send(ws, { type:'error', message: 'Quiz is not in lobby phase' })
          return
        }
        // TODO: Appeler room.addPlayer(message.name, ws)
        const playerId = room.addPlayer(message.name, ws)
        // TODO: Stocker l'association ws -> { room, playerId } dans clientRoomMap
        clientRoomMap.set(ws, { room, playerId })
        send(ws, { type: 'joined', playerId, players: Array.from(room.players.values()).map(p => p.name) })
        room.phase = 'lobby'
        send(ws, { type: 'sync', phase: 'lobby', data: { quizCode: message.quizCode } })
        break
      }

      // ============================================================
      // Un joueur envoie sa reponse
      // ============================================================
      case 'answer': {
        // TODO: Recuperer le { room, playerId } depuis clientRoomMap
        const { room, playerId } = clientRoomMap.get(ws) || { room: null, playerId: null }
        // TODO: Si non trouve, envoyer une erreur
        if (!room || !playerId) {
          send(ws, { type:'error', message: 'Player not found' })
          return
        }
        // TODO: Appeler room.handleAnswer(playerId, message.choiceIndex)
        room.handleAnswer(playerId, message.choiceIndex)
        send(ws, { type: 'sync', phase: 'question', data: { question: room.questions[room.currentQuestionIndex] as Omit<QuizQuestion, 'correctIndex'>, index: room.currentQuestionIndex, total: room.questions.length } })
        break
      }

      // ============================================================
      // Le host cree un nouveau quiz
      // ============================================================
      case 'host:create': {
        // TODO: Generer un code unique avec generateQuizCode() 
        const code = generateQuizCode()
        // TODO: Creer une nouvelle QuizRoom (id = Date.now().toString(), code)
        const room = new QuizRoom(Date.now().toString(), code)
        // TODO: Assigner hostWs, title, questions sur la room
        room.hostWs = ws
        room.title = message.title
        room.questions = message.questions
        // TODO: Stocker la room dans rooms (cle = code)
        rooms.set(code, room)
        // TODO: Stocker l'association host ws -> room dans hostRoomMap
        hostRoomMap.set(ws, room)
        // TODO: Envoyer un message sync au host : { type: 'sync', phase: 'lobby', data: { quizCode: code } }
        send(ws, { type: 'sync', phase: 'lobby', data: { quizCode: code } })
        break
      }

      // ============================================================
      // Le host demarre le quiz
      // ============================================================
      case 'host:start': {
        // TODO: Recuperer la room depuis hostRoomMap
        const room = hostRoomMap.get(ws)
        // TODO: Si non trouvee, envoyer une erreur
        if (!room) {
          send(ws, { type:'error', message: 'Room not found' })
          return
        }
        // TODO: Appeler room.start()
        room.start()
        send(ws, { type: 'sync', phase: 'question', data: { question: room.questions[room.currentQuestionIndex] as Omit<QuizQuestion, 'correctIndex'>, index: room.currentQuestionIndex, total: room.questions.length } })
        break
      }

      // ============================================================
      // Le host passe a la question suivante
      // ============================================================
      case 'host:next': {
        // TODO: Recuperer la room depuis hostRoomMap
        const room = hostRoomMap.get(ws)
        // TODO: Si non trouvee, envoyer une erreur
        if (!room) {
          send(ws, { type:'error', message: 'Room not found' })
          return
        }
        // TODO: Appeler room.nextQuestion()
        room.nextQuestion()
        send(ws, { type: 'sync', phase: 'question', data: { question: room.questions[room.currentQuestionIndex] as Omit<QuizQuestion, 'correctIndex'>, index: room.currentQuestionIndex, total: room.questions.length } })
        break
      }

      // ============================================================
      // Le host termine le quiz
      // ============================================================
      case 'host:end': {
        // TODO: Recuperer la room depuis hostRoomMap
        const room = hostRoomMap.get(ws)
        // TODO: Si non trouvee, envoyer une erreur
        if (!room) {
          send(ws, { type:'error', message: 'Room not found' })
          return
        }
        // TODO: Appeler room.end()
        room.end()
        // TODO: Supprimer la room de rooms
        rooms.delete(room.code)
        hostRoomMap.delete(ws)
        clientRoomMap.delete(ws)
        // TODO: Nettoyer hostRoomMap et clientRoomMap
        hostRoomMap.delete(ws)
        clientRoomMap.delete(ws)
        break
      }

      default: {
        send(ws, { type: 'error', message: `Type de message inconnu` })
      }
    }
  })

  // --- Gestion de la deconnexion ---
  ws.on('close', () => {
    console.log('[Server] Connexion fermee')

    // TODO: Nettoyer clientRoomMap si c'etait un joueur
    const { room, playerId } = clientRoomMap.get(ws) || { room: null, playerId: null }
    if (room) {
      room.players.delete(playerId)
    }
    clientRoomMap.delete(ws)
    // TODO: Nettoyer hostRoomMap si c'etait un host
    const hostRoom = hostRoomMap.get(ws)
    if (hostRoom) {
      hostRoom.end()
      rooms.delete(hostRoom.code)
      hostRoomMap.delete(ws)
    }
    clientRoomMap.delete(ws)
  })

  ws.on('error', (err: Error) => {
    console.error('[Server] Erreur WebSocket:', err.message)
  })
})

// ---- Demarrage du serveur ----
httpServer.listen(PORT, () => {
  console.log(`[Server] Serveur WebSocket demarre sur ws://localhost:${PORT}`)
})
