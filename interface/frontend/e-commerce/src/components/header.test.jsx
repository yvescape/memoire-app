import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '../test/utils.jsx'
import userEvent from '@testing-library/user-event'
import Header from './header.jsx'
import { loginUser } from '../test/utils.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── Rendu de base ─────────────────────────────────────────────────────────
// Le Header rend les liens à la fois en desktop et mobile → getAllByRole
describe('Header — rendu de base', () => {
  it('affiche les liens de navigation principaux', () => {
    render(<Header />)
    expect(screen.getAllByRole('button', { name: /collection/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /notre histoire/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /contact/i })[0]).toBeInTheDocument()
  })

  it('affiche le bouton panier avec aria-label', () => {
    render(<Header />)
    // au moins un bouton "Panier" existe (desktop cart icon + mobile)
    expect(screen.getAllByRole('button', { name: /panier/i })[0]).toBeInTheDocument()
  })

  it('affiche le bouton compte', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /mon compte/i })).toBeInTheDocument()
  })
})

// ── Navigation ────────────────────────────────────────────────────────────
describe('Header — navigation', () => {
  it('navigue vers /products au clic sur "Collection"', async () => {
    const user = userEvent.setup()
    render(<Header />)
    // clic sur le premier bouton Collection (desktop nav)
    await user.click(screen.getAllByRole('button', { name: /collection/i })[0])
    expect(mockNavigate).toHaveBeenCalledWith('/products')
  })

  it('navigue vers /cart au clic sur le bouton panier', async () => {
    const user = userEvent.setup()
    render(<Header />)
    await user.click(screen.getAllByRole('button', { name: /panier/i })[0])
    expect(mockNavigate).toHaveBeenCalledWith('/cart')
  })

  it('navigue vers /login au clic sur le compte si l\'utilisateur n\'est pas connecté', async () => {
    const user = userEvent.setup()
    render(<Header />)
    await user.click(screen.getByRole('button', { name: /mon compte/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})

// ── État non connecté ─────────────────────────────────────────────────────
describe('Header — utilisateur non connecté', () => {
  it('n\'affiche pas l\'indicateur de connexion sans tokens', () => {
    const { container } = render(<Header />)
    expect(container.querySelector('.user-dot')).not.toBeInTheDocument()
  })
})

// ── État connecté ─────────────────────────────────────────────────────────
describe('Header — utilisateur connecté', () => {
  it('affiche l\'indicateur de connexion quand les tokens sont valides', () => {
    loginUser()
    const { container } = render(<Header />)
    expect(container.querySelector('.user-dot')).toBeInTheDocument()
  })

  it('affiche le menu déroulant au clic sur le compte', async () => {
    loginUser()
    const user = userEvent.setup()
    render(<Header />)
    await user.click(screen.getByRole('button', { name: /mon compte/i }))
    // "Déconnexion" apparaît dans le dropdown ET dans le menu mobile
    expect(screen.getAllByRole('button', { name: /déconnexion/i })[0]).toBeInTheDocument()
  })

  it('efface les tokens au clic sur "Déconnexion"', async () => {
    loginUser()
    const user = userEvent.setup()
    render(<Header />)
    await user.click(screen.getByRole('button', { name: /mon compte/i }))
    // clic sur le premier bouton déconnexion (dropdown desktop)
    await user.click(screen.getAllByRole('button', { name: /déconnexion/i })[0])
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('navigue vers "/" après déconnexion', async () => {
    loginUser()
    const user = userEvent.setup()
    render(<Header />)
    await user.click(screen.getByRole('button', { name: /mon compte/i }))
    await user.click(screen.getAllByRole('button', { name: /déconnexion/i })[0])
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})

// ── Compteur panier ───────────────────────────────────────────────────────
describe('Header — compteur panier', () => {
  it('affiche le badge panier avec le total des quantités après chargement', async () => {
    // MSW retourne 1 article avec quantité 2 → total = 2
    render(<Header />)
    await waitFor(() => {
      expect(screen.getByLabelText(/articles dans le panier/i)).toHaveTextContent('2')
    })
  })

  it('met à jour le compteur au déclenchement de l\'événement cart-change', async () => {
    render(<Header />)
    await waitFor(() => {
      expect(screen.getByLabelText(/articles dans le panier/i)).toBeInTheDocument()
    })
    window.dispatchEvent(new Event('cart-change'))
    await waitFor(() => {
      expect(screen.getByLabelText(/articles dans le panier/i)).toHaveTextContent('2')
    })
  })

  it('met à jour l\'état de connexion au déclenchement de l\'événement auth-change', async () => {
    const { container } = render(<Header />)
    expect(container.querySelector('.user-dot')).not.toBeInTheDocument()

    loginUser()
    window.dispatchEvent(new Event('auth-change'))

    await waitFor(() => {
      expect(container.querySelector('.user-dot')).toBeInTheDocument()
    })
  })
})
