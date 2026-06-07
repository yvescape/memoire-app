import { describe, it, expect, vi } from 'vitest'
import { render, screen, loginUser } from './utils.jsx'

// ── Validation que jest-dom est chargé ────────────────────────────────────
describe('jest-dom matchers', () => {
  it('toBeInTheDocument fonctionne', () => {
    document.body.innerHTML = '<button>Cliquer</button>'
    expect(document.querySelector('button')).toBeInTheDocument()
  })

  it('toHaveTextContent fonctionne', () => {
    document.body.innerHTML = '<p>Bonjour</p>'
    expect(document.querySelector('p')).toHaveTextContent('Bonjour')
  })
})

// ── Validation du render custom avec MemoryRouter ─────────────────────────
describe('render custom avec MemoryRouter', () => {
  it('rend un composant simple', () => {
    function Hello() {
      return <p>Hello Élyse</p>
    }
    render(<Hello />)
    expect(screen.getByText('Hello Élyse')).toBeInTheDocument()
  })

  it('accepte un paramètre route', () => {
    function ShowPath() {
      const { pathname } = window.location
      return <span data-testid="path">{pathname}</span>
    }
    render(<ShowPath />, { route: '/products' })
    // MemoryRouter ne change pas window.location → on vérifie juste que ça monte
    expect(screen.getByTestId('path')).toBeInTheDocument()
  })
})

// ── Validation de loginUser (helper localStorage) ─────────────────────────
describe('helper loginUser', () => {
  it('injecte les tokens dans localStorage', () => {
    loginUser(42)
    expect(localStorage.getItem('access_token')).toBeTruthy()
    expect(localStorage.getItem('refresh_token')).toBeTruthy()
    expect(localStorage.getItem('session_id')).toBe('test-session-id')
  })

  it('localStorage est vidé entre les tests (afterEach)', () => {
    // Ce test tourne APRÈS loginUser → setup.js fait localStorage.clear() en afterEach
    // On vérifie donc que l'isolation fonctionne (tokens non persistés d'un test à l'autre)
    expect(localStorage.getItem('access_token')).toBeNull()
  })
})

// ── Validation que MSW intercepte les requêtes ────────────────────────────
describe('MSW — interception des requêtes', () => {
  it('intercepte POST /api/auth/ (login)', async () => {
    const res = await fetch('/api/auth/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
    })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveProperty('access')
    expect(data).toHaveProperty('refresh')
  })

  it('retourne 401 pour des identifiants incorrects', async () => {
    const res = await fetch('/api/auth/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' }),
    })
    expect(res.status).toBe(401)
  })

  it('intercepte GET /api/products/', async () => {
    const res = await fetch('/api/products/')
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(data).toHaveProperty('results')
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBeGreaterThan(0)
  })

  it('intercepte GET /api/orders/delivery-options/', async () => {
    const res = await fetch('/api/orders/delivery-options/')
    const data = await res.json()
    expect(res.ok).toBe(true)
    expect(Array.isArray(data)).toBe(true)
    expect(data[0]).toHaveProperty('name')
    expect(data[0]).toHaveProperty('price')
  })

  it('retourne 402 pour une carte refusée', async () => {
    const res = await fetch('/api/payments/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_number: '0000000000000000', order_id: 42 }),
    })
    expect(res.status).toBe(402)
  })
})
