import WebSocket from "ws"
import { vi } from "vitest"

export const mockWs = (): WebSocket => {
  return {
    readyState: WebSocket.OPEN,
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
    terminate: vi.fn(),
  } as unknown as WebSocket
}