import '@testing-library/jest-dom'
import { server } from './mocks/server'

// jsdom ne supporte pas IntersectionObserver (utilisé dans home.jsx et products.jsx)
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())
