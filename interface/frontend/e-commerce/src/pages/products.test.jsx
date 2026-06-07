import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '../test/utils.jsx'
import userEvent from '@testing-library/user-event'
import Products from './products.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── Rendu initial ──────────────────────────────────────────────────────────
describe('Products — rendu initial', () => {
  it('affiche le spinner de chargement au démarrage', () => {
    render(<Products />)
    // La page affiche "Chargement de la collection…" pendant le fetch
    expect(screen.getByText(/chargement de la collection/i)).toBeInTheDocument()
  })

  it('affiche les boutons de filtre famille olfactive', () => {
    render(<Products />)
    // "Tous" existe dans FAMILIES et GENDERS → 2 boutons → getAllByRole
    expect(screen.getAllByRole('button', { name: 'Tous' })[0]).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Floral' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Oriental' })).toBeInTheDocument()
  })

  it('affiche les boutons de filtre genre', () => {
    render(<Products />)
    expect(screen.getByRole('button', { name: 'Femme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Homme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mixte' })).toBeInTheDocument()
  })

  it('affiche le champ de recherche', () => {
    render(<Products />)
    expect(screen.getByPlaceholderText(/nom, notes, famille/i)).toBeInTheDocument()
  })

  it('affiche le select de tri', () => {
    render(<Products />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})

// ── Chargement des produits ────────────────────────────────────────────────
describe('Products — chargement API', () => {
  it('affiche les produits après chargement', async () => {
    render(<Products />)
    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
      expect(screen.getByText('Élyse Oud')).toBeInTheDocument()
    })
  })

  it('affiche le compteur de fragrances', async () => {
    render(<Products />)
    await waitFor(() => {
      expect(screen.getByText(/2 fragrances/i)).toBeInTheDocument()
    })
  })

  it('affiche les prix des produits formatés', async () => {
    render(<Products />)
    await waitFor(() => {
      // 45000 → "45 000 FCFA", 65000 → "65 000 FCFA"
      expect(screen.getAllByText(/45[\s ]000 FCFA/)[0]).toBeInTheDocument()
      expect(screen.getAllByText(/65[\s ]000 FCFA/)[0]).toBeInTheDocument()
    })
  })

  it('affiche le badge "Nouveau" sur Élyse Oud', async () => {
    render(<Products />)
    await waitFor(() => {
      expect(screen.getByText('Nouveau')).toBeInTheDocument()
    })
  })
})

// ── Filtres famille ────────────────────────────────────────────────────────
describe('Products — filtres famille', () => {
  it('filtre les produits par famille Floral', async () => {
    const user = userEvent.setup()
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Floral' }))

    // Élyse Rose (family: Floral) reste ; Élyse Oud (family: Oriental) disparaît
    expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    expect(screen.queryByText('Élyse Oud')).not.toBeInTheDocument()
    expect(screen.getByText(/1 fragrance/i)).toBeInTheDocument()
  })

  it('filtre les produits par famille Oriental', async () => {
    const user = userEvent.setup()
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Élyse Oud')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Oriental' }))

    expect(screen.queryByText('Élyse Rose')).not.toBeInTheDocument()
    expect(screen.getByText('Élyse Oud')).toBeInTheDocument()
  })

  it('réinitialise le filtre famille au clic sur "Tous"', async () => {
    const user = userEvent.setup()
    render(<Products />)

    await waitFor(() => {
      expect(screen.getAllByText('Élyse Rose')[0]).toBeInTheDocument()
    })

    // Filtrer puis réinitialiser
    await user.click(screen.getByRole('button', { name: 'Floral' }))
    expect(screen.queryByText('Élyse Oud')).not.toBeInTheDocument()

    // "Tous" dans FAMILIES est le premier → getAllByRole()[0]
    await user.click(screen.getAllByRole('button', { name: 'Tous' })[0])
    expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    expect(screen.getByText('Élyse Oud')).toBeInTheDocument()
  })
})

// ── Filtres genre ──────────────────────────────────────────────────────────
describe('Products — filtres genre', () => {
  it('filtre les produits par genre Femme', async () => {
    const user = userEvent.setup()
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Femme' }))

    // Élyse Rose (gender: Femme) reste ; Élyse Oud (gender: Mixte) disparaît
    expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    expect(screen.queryByText('Élyse Oud')).not.toBeInTheDocument()
  })

  it('filtre les produits par genre Mixte', async () => {
    const user = userEvent.setup()
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Élyse Oud')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Mixte' }))

    expect(screen.queryByText('Élyse Rose')).not.toBeInTheDocument()
    expect(screen.getByText('Élyse Oud')).toBeInTheDocument()
  })
})

// ── Recherche ──────────────────────────────────────────────────────────────
describe('Products — recherche', () => {
  it('affiche les résultats correspondant à la recherche', async () => {
    const user = userEvent.setup()
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/nom, notes, famille/i)
    await user.type(searchInput, 'Rose')

    // Section résultats de recherche apparaît
    expect(screen.getByText(/résultats de recherche/i)).toBeInTheDocument()
    expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    expect(screen.queryByText('Élyse Oud')).not.toBeInTheDocument()
  })

  it('affiche un message si aucun résultat', async () => {
    const user = userEvent.setup()
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/nom, notes, famille/i)
    await user.type(searchInput, 'xyzabcnotfound')

    expect(screen.getByText(/aucun résultat trouvé/i)).toBeInTheDocument()
  })

  it('efface la recherche au clic sur le bouton effacer (aucun résultat)', async () => {
    const user = userEvent.setup()
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/nom, notes, famille/i)
    // Recherche sans résultats → le bouton "Effacer la recherche" apparaît
    await user.type(searchInput, 'xyznotfound')
    expect(screen.getByText(/aucun résultat trouvé/i)).toBeInTheDocument()

    // "Effacer la recherche" est le seul bouton accessible pour effacer (no-results section)
    await user.click(screen.getByRole('button', { name: /effacer la recherche/i }))
    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
      expect(screen.getByText('Élyse Oud')).toBeInTheDocument()
    })
  })
})

// ── Navigation ──────────────────────────────────────────────────────────────
describe('Products — navigation vers le détail', () => {
  it('navigue vers /product/:id au clic sur un produit', async () => {
    const user = userEvent.setup()
    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    })

    // ProductCard est défini à l'intérieur de Products → React le remonte à chaque
    // re-render (nouveau type de composant). fetchProductStates déclenche un re-render
    // qui détache l'ancien noeud DOM avant que user.click puisse tirer ses événements.
    // Solution : laisser tous les micro-tasks (MSW) et macrotasks (React scheduler)
    // se terminer avant de cliquer, pour obtenir le noeud stable post-remontage.
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })

    await user.click(screen.getByText('Élyse Rose'))
    expect(mockNavigate).toHaveBeenCalledWith('/product/1')
  })
})
