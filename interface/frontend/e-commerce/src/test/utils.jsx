import { render as rtlRender } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/**
 * Render avec MemoryRouter — nécessaire car tous les composants pages
 * utilisent useNavigate / useParams / useLocation.
 */
export function render(ui, { route = '/', ...options } = {}) {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  )
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

/**
 * Simule un utilisateur connecté en injectant des tokens valides dans localStorage.
 * À appeler avant render() dans les tests nécessitant l'auth.
 */
export function loginUser(userId = 1) {
  const makeJwt = (id) => {
    const payload = btoa(
      JSON.stringify({ user_id: id, exp: Math.floor(Date.now() / 1000) + 3600 })
    )
    return `eyJhbGciOiJIUzI1NiJ9.${payload}.fake_sig`
  }
  localStorage.setItem('access_token', makeJwt(userId))
  localStorage.setItem('refresh_token', makeJwt(userId))
  localStorage.setItem('session_id', 'test-session-id')
}

export function logoutUser() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('session_id')
}

// Ré-exporte tout RTL pour que les tests n'aient qu'un seul import
export * from '@testing-library/react'
export { render as rtlRender } from '@testing-library/react'
