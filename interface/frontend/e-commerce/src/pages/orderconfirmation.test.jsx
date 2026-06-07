import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils.jsx'
import userEvent from '@testing-library/user-event'
import OrderConfirmation from './orderconfirmation.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── Rendu ─────────────────────────────────────────────────────────────────
describe('OrderConfirmation — rendu', () => {
  it('affiche le label "Commande confirmée"', () => {
    render(<OrderConfirmation />)
    expect(screen.getByText(/commande confirmée/i)).toBeInTheDocument()
  })

  it('affiche le titre principal contenant "commande"', () => {
    render(<OrderConfirmation />)
    expect(screen.getByRole('heading', { name: /merci pour votre/i })).toBeInTheDocument()
  })

  it('affiche un numéro de commande au format PF-XXXXX', () => {
    render(<OrderConfirmation />)
    const orderNumberEl = screen.getByText(/^PF-\d{5}$/)
    expect(orderNumberEl).toBeInTheDocument()
  })

  it('affiche la date du jour en français', () => {
    render(<OrderConfirmation />)
    const today = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    expect(screen.getByText(today)).toBeInTheDocument()
  })

  it('affiche le délai de livraison estimé', () => {
    render(<OrderConfirmation />)
    expect(screen.getByText(/3.5 jours ouvrés/i)).toBeInTheDocument()
  })
})

// ── Timeline de suivi ─────────────────────────────────────────────────────
describe('OrderConfirmation — timeline', () => {
  it('affiche les 4 étapes de suivi', () => {
    render(<OrderConfirmation />)
    expect(screen.getByText(/commande reçue/i)).toBeInTheDocument()
    expect(screen.getByText(/en préparation/i)).toBeInTheDocument()
    expect(screen.getByText(/expédiée/i)).toBeInTheDocument()
    expect(screen.getByText(/livrée/i)).toBeInTheDocument()
  })
})

// ── Actions ───────────────────────────────────────────────────────────────
describe('OrderConfirmation — navigation', () => {
  it('affiche un bouton "Continuer les achats"', () => {
    render(<OrderConfirmation />)
    expect(screen.getByRole('button', { name: /continuer les achats/i })).toBeInTheDocument()
  })

  it('"Continuer les achats" navigue vers /products', async () => {
    const user = userEvent.setup()
    render(<OrderConfirmation />)
    await user.click(screen.getByRole('button', { name: /continuer les achats/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/products')
  })

  it('affiche un lien vers le contact', () => {
    render(<OrderConfirmation />)
    expect(screen.getByText(/contact@maison-parfum\.fr/i)).toBeInTheDocument()
  })
})
