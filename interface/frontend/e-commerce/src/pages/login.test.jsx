import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils.jsx'
import userEvent from '@testing-library/user-event'
import Login from './login.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── Rendu initial ─────────────────────────────────────────────────────────
describe('Login — rendu initial', () => {
  it('affiche le titre "Connexion"', () => {
    render(<Login />)
    expect(screen.getByRole('heading', { name: /connexion/i })).toBeInTheDocument()
  })

  it('affiche un champ email', () => {
    render(<Login />)
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument()
  })

  it('affiche un champ mot de passe masqué par défaut', () => {
    render(<Login />)
    // Utiliser la string exacte pour éviter de matcher le aria-label du toggle
    const input = screen.getByLabelText('Mot de passe')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('affiche le bouton de soumission actif', () => {
    render(<Login />)
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeEnabled()
  })

  it('n\'affiche aucun message d\'erreur au démarrage', () => {
    render(<Login />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ── Toggle visibilité mot de passe ────────────────────────────────────────
describe('Login — toggle mot de passe', () => {
  it('bascule le champ en type "text" au clic sur le bouton toggle', async () => {
    const user = userEvent.setup()
    render(<Login />)
    const toggle = screen.getByRole('button', { name: /afficher le mot de passe/i })
    const input = screen.getByLabelText('Mot de passe')

    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
  })

  it('remasque le mot de passe au deuxième clic', async () => {
    const user = userEvent.setup()
    render(<Login />)
    const input = screen.getByLabelText('Mot de passe')

    await user.click(screen.getByRole('button', { name: /afficher le mot de passe/i }))
    await user.click(screen.getByRole('button', { name: /masquer le mot de passe/i }))
    expect(input).toHaveAttribute('type', 'password')
  })
})

// ── Soumission — succès ───────────────────────────────────────────────────
describe('Login — soumission réussie', () => {
  it('stocke les tokens dans localStorage après une connexion réussie', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeTruthy()
      expect(localStorage.getItem('refresh_token')).toBeTruthy()
    })
  })

  it('redirige vers "/" après une connexion réussie', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})

// ── Soumission — erreur ───────────────────────────────────────────────────
describe('Login — soumission en erreur', () => {
  it('affiche un message d\'erreur si les identifiants sont incorrects (401)', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'test@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByText(/identifiants incorrects/i)).toBeInTheDocument()
    })
  })

  it('ne stocke pas de tokens après un échec de connexion', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'test@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeNull()
    })
  })

  it('ne redirige pas après un échec de connexion', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'test@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(screen.getByText(/identifiants incorrects/i)).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ── État de chargement ────────────────────────────────────────────────────
describe('Login — état de chargement', () => {
  it('désactive le bouton et affiche "Connexion en cours…" pendant la soumission', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'user@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'password123')

    const btn = screen.getByRole('button', { name: /se connecter/i })
    user.click(btn)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connexion en cours/i })).toBeDisabled()
    })
  })
})

// ── Navigation ────────────────────────────────────────────────────────────
describe('Login — liens de navigation', () => {
  it('navigue vers /register au clic sur "Créer un compte"', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.click(screen.getByText(/créer un compte/i))
    expect(mockNavigate).toHaveBeenCalledWith('/register')
  })

  it('navigue vers /forgot-password au clic sur "Mot de passe oublié ?"', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.click(screen.getByText(/mot de passe oublié/i))
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password')
  })
})
