import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils.jsx'
import userEvent from '@testing-library/user-event'
import Register from './register.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── Rendu initial ─────────────────────────────────────────────────────────
describe('Register — rendu initial', () => {
  it('affiche le titre "Inscription"', () => {
    render(<Register />)
    expect(screen.getByRole('heading', { name: /inscription/i })).toBeInTheDocument()
  })

  it('affiche tous les champs du formulaire', () => {
    render(<Register />)
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^nom$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument()
  })

  it('affiche le bouton "Créer mon compte" actif', () => {
    render(<Register />)
    expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeEnabled()
  })

  it('n\'affiche aucun message d\'erreur au démarrage', () => {
    render(<Register />)
    expect(screen.queryByText(/erreur/i)).not.toBeInTheDocument()
  })
})

// ── Indicateur de force du mot de passe ──────────────────────────────────
describe('Register — indicateur de force du mot de passe', () => {
  it('n\'affiche pas l\'indicateur quand le champ est vide', () => {
    render(<Register />)
    expect(screen.queryByText(/faible|moyen|fort/i)).not.toBeInTheDocument()
  })

  it('affiche "Faible" pour un mot de passe très court', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await user.type(screen.getByLabelText(/^mot de passe$/i), 'abc')
    expect(screen.getByText('Faible')).toBeInTheDocument()
  })

  it('affiche "Moyen" pour un mot de passe de longueur intermédiaire', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await user.type(screen.getByLabelText(/^mot de passe$/i), 'abcdefgh')
    expect(screen.getByText('Moyen')).toBeInTheDocument()
  })

  it('affiche "Très fort" pour un mot de passe avec majuscule et chiffre', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await user.type(screen.getByLabelText(/^mot de passe$/i), 'Motdepasse1')
    expect(screen.getByText('Très fort')).toBeInTheDocument()
  })
})

// ── Indicateur de correspondance des mots de passe ───────────────────────
describe('Register — correspondance des mots de passe', () => {
  it('affiche un message positif quand les mots de passe correspondent', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await user.type(screen.getByLabelText(/^mot de passe$/i), 'motdepasse')
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'motdepasse')
    expect(screen.getByText(/les mots de passe correspondent/i)).toBeInTheDocument()
  })

  it('affiche un avertissement quand les mots de passe ne correspondent pas', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await user.type(screen.getByLabelText(/^mot de passe$/i), 'motdepasse')
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'different')
    expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument()
  })
})

// ── Toggle visibilité des mots de passe ──────────────────────────────────
describe('Register — toggle mot de passe', () => {
  it('bascule le champ mot de passe en type text', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await user.click(screen.getByRole('button', { name: /afficher le mot de passe/i }))
    expect(screen.getByLabelText(/^mot de passe$/i)).toHaveAttribute('type', 'text')
  })

  it('bascule le champ confirmation en type text', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await user.click(screen.getByRole('button', { name: /afficher la confirmation/i }))
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toHaveAttribute('type', 'text')
  })
})

// ── Validations côté client ───────────────────────────────────────────────
describe('Register — validations client', () => {
  const fillForm = async (user, overrides = {}) => {
    const defaults = {
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@test.com',
      password: 'MotDePasse1',
      confirm: 'MotDePasse1',
      acceptTerms: true,
    }
    const data = { ...defaults, ...overrides }

    await user.type(screen.getByLabelText(/prénom/i), data.firstName)
    await user.type(screen.getByLabelText(/^nom$/i), data.lastName)
    await user.type(screen.getByLabelText(/adresse e-mail/i), data.email)
    await user.type(screen.getByLabelText(/^mot de passe$/i), data.password)
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), data.confirm)
    if (data.acceptTerms) {
      await user.click(screen.getByRole('checkbox'))
    }
  }

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await fillForm(user, { confirm: 'different' })
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))
    // Le message d'erreur submit inclut un point final (contrairement à l'indicateur temps réel)
    expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument()
  })

  it('affiche une erreur si le mot de passe est trop court (< 8 chars)', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await fillForm(user, { password: 'court', confirm: 'court' })
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))
    expect(screen.getByText(/au moins 8 caractères/i)).toBeInTheDocument()
  })

  it('affiche une erreur si les conditions d\'utilisation ne sont pas acceptées', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await fillForm(user, { acceptTerms: false })
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))
    // "Veuillez accepter" est unique dans la page (contrairement à "conditions d'utilisation")
    expect(screen.getByText(/veuillez accepter/i)).toBeInTheDocument()
  })

  it('ne soumet pas le formulaire si les validations client échouent', async () => {
    const user = userEvent.setup()
    render(<Register />)
    await fillForm(user, { confirm: 'different' })
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ── Soumission — succès ───────────────────────────────────────────────────
describe('Register — soumission réussie', () => {
  it('redirige vers /login avec { registered: true } après inscription réussie', async () => {
    const user = userEvent.setup()
    render(<Register />)

    await user.type(screen.getByLabelText(/prénom/i), 'Alice')
    await user.type(screen.getByLabelText(/^nom$/i), 'Dupont')
    await user.type(screen.getByLabelText(/adresse e-mail/i), 'alice@test.com')
    await user.type(screen.getByLabelText(/^mot de passe$/i), 'MotDePasse1')
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'MotDePasse1')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { registered: true } })
    })
  })
})

// ── Soumission — erreur serveur ───────────────────────────────────────────
describe('Register — erreur serveur', () => {
  it('affiche l\'erreur si l\'email est déjà utilisé (400 du serveur)', async () => {
    const user = userEvent.setup()
    render(<Register />)

    await user.type(screen.getByLabelText(/prénom/i), 'Bob')
    await user.type(screen.getByLabelText(/^nom$/i), 'Martin')
    // existing@test.com déclenche une erreur 400 dans le handler MSW
    await user.type(screen.getByLabelText(/adresse e-mail/i), 'existing@test.com')
    await user.type(screen.getByLabelText('Mot de passe'), 'MotDePasse1')
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'MotDePasse1')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    // L'erreur apparaît deux fois (banner + champ email) → getAllByText
    await waitFor(() => {
      expect(screen.getAllByText(/compte avec cet email existe déjà/i).length).toBeGreaterThan(0)
    })
  })
})
