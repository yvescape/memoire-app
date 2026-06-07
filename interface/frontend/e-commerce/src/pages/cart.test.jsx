import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils.jsx'
import userEvent from '@testing-library/user-event'
import Cart from './cart.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── État de chargement ─────────────────────────────────────────────────────
describe('Cart — chargement', () => {
  it('affiche le spinner pendant le chargement', () => {
    render(<Cart />)
    // Le titre "Chargement…" est affiché avant que les données arrivent
    expect(screen.getByText(/chargement/i)).toBeInTheDocument()
  })
})

// ── Affichage du panier ────────────────────────────────────────────────────
describe('Cart — affichage des articles', () => {
  it('affiche le nom du produit après chargement', async () => {
    render(<Cart />)
    await waitFor(() => {
      expect(screen.getByText('Élyse Rose')).toBeInTheDocument()
    })
  })

  it('affiche la quantité de l\'article', async () => {
    render(<Cart />)
    await waitFor(() => {
      // MOCK_CART_ITEMS[0].quantity = 2
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('affiche le titre avec le nombre d\'articles total', async () => {
    render(<Cart />)
    await waitFor(() => {
      // totalItems = 2 → "Votre sélection (2 articles)"
      expect(screen.getByText(/votre sélection \(2 articles?\)/i)).toBeInTheDocument()
    })
  })

  it('affiche le prix unitaire de l\'article', async () => {
    render(<Cart />)
    await waitFor(() => {
      expect(screen.getByText(/45[\s ]000 FCFA \/ unité/i)).toBeInTheDocument()
    })
  })

  it('affiche le bouton de suppression de l\'article', async () => {
    render(<Cart />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /supprimer élyse rose/i })).toBeInTheDocument()
    })
  })
})

// ── Résumé de commande ─────────────────────────────────────────────────────
describe('Cart — résumé de commande', () => {
  it('affiche le sous-total', async () => {
    render(<Cart />)
    await waitFor(() => {
      // subtotal = 90000 → "90 000 FCFA"
      expect(screen.getAllByText(/90[\s ]000 FCFA/i)[0]).toBeInTheDocument()
    })
  })

  it('affiche le montant de livraison', async () => {
    render(<Cart />)
    await waitFor(() => {
      // delivery_price = 3000 → "3 000 FCFA"
      // Utilisation de getAllByText car "93 000 FCFA" contient aussi "3 000" comme sous-chaîne
      expect(screen.getAllByText(/3[\s  ]000/)[0]).toBeInTheDocument()
    })
  })

  it('affiche le total TTC', async () => {
    render(<Cart />)
    await waitFor(() => {
      // total = 93000 → "93 000 FCFA"
      expect(screen.getAllByText(/93[\s ]000 FCFA/i)[0]).toBeInTheDocument()
    })
  })
})

// ── Interactions ───────────────────────────────────────────────────────────
describe('Cart — suppression d\'article', () => {
  it('retire l\'article et affiche le panier vide', async () => {
    const user = userEvent.setup()
    render(<Cart />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /supprimer élyse rose/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /supprimer élyse rose/i }))

    await waitFor(() => {
      // Après suppression du seul article → panier vide
      expect(screen.getByText(/votre panier est/i)).toBeInTheDocument()
    })
  })
})

// ── Navigation ─────────────────────────────────────────────────────────────
describe('Cart — navigation', () => {
  it('navigue vers /checkout au clic sur "Procéder au paiement"', async () => {
    const user = userEvent.setup()
    render(<Cart />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /procéder au paiement/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /procéder au paiement/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/checkout')
  })

  it('navigue vers /products au clic sur "Continuer les achats"', async () => {
    const user = userEvent.setup()
    render(<Cart />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continuer les achats/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /continuer les achats/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/products')
  })
})

// ── Panier vide ────────────────────────────────────────────────────────────
describe('Cart — panier vide (sans commande pending)', () => {
  it('affiche le message de panier vide si aucune commande n\'est trouvée', async () => {
    const { server } = await import('../test/mocks/server.js')
    const { http, HttpResponse } = await import('msw')

    // Simuler l'absence de commande pending
    server.use(
      http.get('/api/orders/my/', () => HttpResponse.json([]))
    )

    render(<Cart />)

    await waitFor(() => {
      // RTL getNodeText ne lit que les noeuds texte directs, pas les enfants <em>
      // → on cible le texte unique de l'état vide dans le <p class="empty-text">
      expect(screen.getByText(/vous n'avez encore aucun article/i)).toBeInTheDocument()
    })
  })
})
