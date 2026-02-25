/**
 * Mock de WebSocket pour les tests
 */

import WebSocket from 'ws'
import { vi } from 'vitest'

export const createMockWebSocket = (): WebSocket => {
  return {
    readyState: WebSocket.OPEN,
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
    terminate: vi.fn(),
  } as unknown as WebSocket
}