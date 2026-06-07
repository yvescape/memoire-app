import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils.jsx'
import userEvent from '@testing-library/user-event'
import ForgotPassword from './forgotpassword.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── Étape email (état initial) ────────────────────────────────────────────
describe('ForgotPassword — étape email', () => {
  it('affiche le titre "Mot de passe oublié"', () => {
    render(<ForgotPassword />)
    expect(screen.getByRole('heading', { name: /mot de passe oublié/i })).toBeInTheDocument()
  })

  it('affiche un champ email', () => {
    render(<ForgotPassword />)
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument()
  })

  it('affiche le bouton "Envoyer le lien"', () => {
    render(<ForgotPassword />)
    expect(screen.getByRole('button', { name: /envoyer le lien/i })).toBeInTheDocument()
  })

  it('n\'affiche pas l\'étape de confirmation au démarrage', () => {
    render(<ForgotPassword />)
    expect(screen.queryByText(/vérifiez votre e-mail/i)).not.toBeInTheDocument()
  })
})

// ── Transition vers l'étape "envoyé" ─────────────────────────────────────
describe('ForgotPassword — transition vers étape envoyé', () => {
  it('passe à l\'étape de confirmation après saisie d\'un email et clic', async () => {
    const user = userEvent.setup()
    render(<ForgotPassword />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'user@test.com')
    await user.click(screen.getByRole('button', { name: /envoyer le lien/i }))

    expect(screen.getByText(/vérifiez votre e-mail/i)).toBeInTheDocument()
  })

  it('affiche l\'adresse email saisie dans la confirmation', async () => {
    const user = userEvent.setup()
    render(<ForgotPassword />)

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'alice@example.com')
    await user.click(screen.getByRole('button', { name: /envoyer le lien/i }))

    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('ne passe pas à l\'étape suivante si le champ email est vide', async () => {
    const user = userEvent.setup()
    render(<ForgotPassword />)

    await user.click(screen.getByRole('button', { name: /envoyer le lien/i }))

    expect(screen.queryByText(/vérifiez votre e-mail/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /mot de passe oublié/i })).toBeInTheDocument()
  })
})

// ── Étape "envoyé" ────────────────────────────────────────────────────────
describe('ForgotPassword — étape envoyé', () => {
  const renderSentStep = async () => {
    const user = userEvent.setup()
    render(<ForgotPassword />)
    await user.type(screen.getByLabelText(/adresse e-mail/i), 'user@test.com')
    await user.click(screen.getByRole('button', { name: /envoyer le lien/i }))
    return user
  }

  it('affiche un bouton "Retour à la connexion"', async () => {
    await renderSentStep()
    expect(screen.getByRole('button', { name: /retour à la connexion/i })).toBeInTheDocument()
  })

  it('affiche un lien "Renvoyer"', async () => {
    await renderSentStep()
    expect(screen.getByText(/renvoyer/i)).toBeInTheDocument()
  })

  it('revient à l\'étape email en cliquant sur "Renvoyer"', async () => {
    const user = await renderSentStep()
    await user.click(screen.getByText(/renvoyer/i))
    expect(screen.getByRole('heading', { name: /mot de passe oublié/i })).toBeInTheDocument()
  })

  it('"Retour à la connexion" navigue vers /login', async () => {
    const user = await renderSentStep()
    await user.click(screen.getByRole('button', { name: /retour à la connexion/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
