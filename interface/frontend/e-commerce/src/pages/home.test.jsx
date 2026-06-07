import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils.jsx'
import userEvent from '@testing-library/user-event'
import Home from './home.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── Rendu initial ──────────────────────────────────────────────────────────
describe('Home — rendu initial', () => {
  it('affiche le titre hero', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('affiche le texte "Maison de parfumerie"', () => {
    render(<Home />)
    expect(screen.getByText(/maison de parfumerie/i)).toBeInTheDocument()
  })

  it('affiche le bouton "Découvrir la collection" dans le hero', () => {
    render(<Home />)
    // Peut exister en doublon (hero + section featured) → getAllByRole
    expect(screen.getAllByRole('button', { name: /découvrir la collection/i })[0]).toBeInTheDocument()
  })

  it('affiche le bouton "Notre histoire"', () => {
    render(<Home />)
    expect(screen.getByRole('button', { name: /notre histoire/i })).toBeInTheDocument()
  })
})

// ── Chargement des produits featured ──────────────────────────────────────
describe('Home — produits featured', () => {
  it('affiche les produits après chargement via API', async () => {
    render(<Home />)
    // MSW retourne MOCK_PRODUCTS → home affiche jusqu'à 3 produits
    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    })
  })

  it('affiche le prix du premier produit formaté', async () => {
    render(<Home />)
    await waitFor(() => {
      // 45000 → "45 000" (formaté avec toLocaleString fr-FR)
      expect(screen.getByText(/45[\s ]000/)).toBeInTheDocument()
    })
  })

  it('affiche la catégorie du produit', async () => {
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('Floral')).toBeInTheDocument()
    })
  })
})

// ── Navigation ─────────────────────────────────────────────────────────────
describe('Home — navigation', () => {
  it('navigue vers /products au clic sur "Découvrir la collection"', async () => {
    const user = userEvent.setup()
    render(<Home />)
    await user.click(screen.getAllByRole('button', { name: /découvrir la collection/i })[0])
    expect(mockNavigate).toHaveBeenCalledWith('/products')
  })

  it('navigue vers /about au clic sur "Notre histoire"', async () => {
    const user = userEvent.setup()
    render(<Home />)
    await user.click(screen.getByRole('button', { name: /notre histoire/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/about')
  })

  it('navigue vers /product/:id au clic sur un produit featured', async () => {
    const user = userEvent.setup()
    render(<Home />)
    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    })
    // Clic sur la carte du produit (l'élément cliquable parent)
    await user.click(screen.getByText('Élyse Rose'))
    expect(mockNavigate).toHaveBeenCalledWith('/product/1')
  })
})

// ── Contenu statique ────────────────────────────────────────────────────────
describe('Home — sections statiques', () => {
  it('affiche la section "Notre philosophie"', () => {
    render(<Home />)
    expect(screen.getByText(/notre philosophie/i)).toBeInTheDocument()
  })

  it('affiche la section témoignages', () => {
    render(<Home />)
    expect(screen.getByText(/témoignages/i)).toBeInTheDocument()
  })

  it('affiche la section "Nos incontournables"', () => {
    render(<Home />)
    expect(screen.getByText(/incontournables/i)).toBeInTheDocument()
  })
})
