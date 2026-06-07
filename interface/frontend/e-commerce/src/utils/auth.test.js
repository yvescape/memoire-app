import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenExpired,
  isAuthenticated,
  refreshAccessToken,
} from './auth'

const makeJwt = (exp = Math.floor(Date.now() / 1000) + 3600) => {
  const payload = btoa(JSON.stringify({ user_id: 1, exp }))
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.fake_sig`
}

const VALID_TOKEN = makeJwt()
const EXPIRED_TOKEN = makeJwt(Math.floor(Date.now() / 1000) - 60)

// ── getAccessToken ────────────────────────────────────────────────────────
describe('getAccessToken', () => {
  it('retourne null quand aucun token n\'est stocké', () => {
    expect(getAccessToken()).toBeNull()
  })

  it('retourne le token stocké dans localStorage', () => {
    localStorage.setItem('access_token', 'tok_abc')
    expect(getAccessToken()).toBe('tok_abc')
  })
})

// ── getRefreshToken ───────────────────────────────────────────────────────
describe('getRefreshToken', () => {
  it('retourne null quand aucun refresh token n\'est stocké', () => {
    expect(getRefreshToken()).toBeNull()
  })

  it('retourne le refresh token stocké dans localStorage', () => {
    localStorage.setItem('refresh_token', 'ref_xyz')
    expect(getRefreshToken()).toBe('ref_xyz')
  })
})

// ── setTokens ─────────────────────────────────────────────────────────────
describe('setTokens', () => {
  it('stocke l\'access token et le refresh token', () => {
    setTokens('acc_123', 'ref_456')
    expect(localStorage.getItem('access_token')).toBe('acc_123')
    expect(localStorage.getItem('refresh_token')).toBe('ref_456')
  })

  it('stocke uniquement l\'access token quand le refresh est omis', () => {
    setTokens('acc_only')
    expect(localStorage.getItem('access_token')).toBe('acc_only')
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('déclenche l\'événement auth-change sur window', () => {
    const handler = vi.fn()
    window.addEventListener('auth-change', handler)
    setTokens('acc', 'ref')
    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener('auth-change', handler)
  })
})

// ── clearTokens ───────────────────────────────────────────────────────────
describe('clearTokens', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', VALID_TOKEN)
    localStorage.setItem('refresh_token', VALID_TOKEN)
  })

  it('supprime l\'access token et le refresh token de localStorage', () => {
    clearTokens()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('déclenche l\'événement auth-change sur window', () => {
    const handler = vi.fn()
    window.addEventListener('auth-change', handler)
    clearTokens()
    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener('auth-change', handler)
  })
})

// ── isTokenExpired ────────────────────────────────────────────────────────
describe('isTokenExpired', () => {
  it('retourne true pour null', () => {
    expect(isTokenExpired(null)).toBe(true)
  })

  it('retourne true pour undefined', () => {
    expect(isTokenExpired(undefined)).toBe(true)
  })

  it('retourne true pour un token avec une structure invalide', () => {
    expect(isTokenExpired('pas_un_jwt')).toBe(true)
  })

  it('retourne true pour un token dont le payload n\'est pas du JSON valide', () => {
    const badPayload = btoa('not_json')
    expect(isTokenExpired(`header.${badPayload}.sig`)).toBe(true)
  })

  it('retourne true pour un token expiré', () => {
    expect(isTokenExpired(EXPIRED_TOKEN)).toBe(true)
  })

  it('retourne false pour un token valide non expiré', () => {
    expect(isTokenExpired(VALID_TOKEN)).toBe(false)
  })
})

// ── isAuthenticated ───────────────────────────────────────────────────────
describe('isAuthenticated', () => {
  it('retourne false quand aucun token n\'est stocké', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('retourne true quand un access token valide est stocké', () => {
    localStorage.setItem('access_token', VALID_TOKEN)
    expect(isAuthenticated()).toBe(true)
  })

  it('retourne false quand seul un access token expiré est stocké', () => {
    localStorage.setItem('access_token', EXPIRED_TOKEN)
    expect(isAuthenticated()).toBe(false)
  })

  it('retourne true quand l\'access est expiré mais le refresh est valide', () => {
    localStorage.setItem('access_token', EXPIRED_TOKEN)
    localStorage.setItem('refresh_token', VALID_TOKEN)
    expect(isAuthenticated()).toBe(true)
  })

  it('retourne false quand les deux tokens sont expirés', () => {
    localStorage.setItem('access_token', EXPIRED_TOKEN)
    localStorage.setItem('refresh_token', EXPIRED_TOKEN)
    expect(isAuthenticated()).toBe(false)
  })
})

// ── refreshAccessToken ────────────────────────────────────────────────────
describe('refreshAccessToken', () => {
  it('retourne null quand aucun refresh token n\'est stocké', async () => {
    expect(await refreshAccessToken()).toBeNull()
  })

  it('retourne null et nettoie les tokens si le refresh est expiré (sans appel API)', async () => {
    localStorage.setItem('refresh_token', EXPIRED_TOKEN)
    const result = await refreshAccessToken()
    expect(result).toBeNull()
    // court-circuite avant l'appel API : les tokens doivent être effacés
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('retourne un nouveau access token JWT quand le refresh est valide', async () => {
    localStorage.setItem('refresh_token', VALID_TOKEN)
    const result = await refreshAccessToken()
    expect(typeof result).toBe('string')
    // un JWT a exactement 3 segments séparés par des points
    expect(result.split('.')).toHaveLength(3)
  })

  it('stocke le nouveau access token dans localStorage après refresh', async () => {
    localStorage.setItem('refresh_token', VALID_TOKEN)
    const newToken = await refreshAccessToken()
    expect(localStorage.getItem('access_token')).toBe(newToken)
  })
})
