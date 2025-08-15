import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Clean up after each test
afterEach(() => {
  cleanup()
  // Clear all timers to prevent hanging
  vi.clearAllTimers()
  // Clear all mocks
  vi.clearAllMocks()
})

// Simple mocks only - fetch and WebSocket
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
  } as Response)
)

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  readyState: number = WebSocket.OPEN // Start as OPEN to avoid timer
  
  constructor(public url: string) {
    // Immediately set as open without using setTimeout
    this.readyState = WebSocket.OPEN
  }
  
  send() {}
  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }
}

window.WebSocket = MockWebSocket as any

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock DOM methods that might not exist in test environment
Element.prototype.scrollIntoView = vi.fn()
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock lucide-react icons - create a proxy that returns icon name for any icon
vi.mock('lucide-react', () => {
  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return () => prop
      }
      return undefined
    }
  })
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))