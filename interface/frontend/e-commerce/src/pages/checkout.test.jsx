import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils.jsx'
import userEvent from '@testing-library/user-event'
import Checkout from './checkout.jsx'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}))

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── Helper : attendre le formulaire de livraison ───────────────────────────
const waitForDeliveryForm = async () => {
  await waitFor(() => {
    expect(screen.getByLabelText('Prénom *')).toBeInTheDocument()
  })
}

// ── Helper : remplir le formulaire de livraison et avancer au paiement ─────
const advanceToPayment = async (user) => {
  await waitForDeliveryForm()
  await user.type(screen.getByLabelText('Prénom *'), 'Alice')
  await user.type(screen.getByLabelText('Nom *'), 'Dupont')
  await user.type(screen.getByLabelText('Téléphone *'), '0102030405')
  await user.type(screen.getByLabelText('Ville *'), 'Paris')
  await user.click(screen.getByRole('button', { name: /continuer vers le paiement/i }))
  await waitFor(() => {
    expect(screen.getByLabelText('Numéro de carte')).toBeInTheDocument()
  })
}

// ── Chargement ─────────────────────────────────────────────────────────────
describe('Checkout — chargement', () => {
  it('affiche le spinner pendant le chargement de la commande', () => {
    render(<Checkout />)
    expect(screen.getByText(/chargement de votre commande/i)).toBeInTheDocument()
  })
})

// ── Étape 0 : Livraison ────────────────────────────────────────────────────
describe('Checkout — formulaire de livraison', () => {
  it('affiche le formulaire après chargement', async () => {
    render(<Checkout />)
    await waitForDeliveryForm()
    expect(screen.getByRole('heading', { name: /adresse de livraison/i })).toBeInTheDocument()
  })

  it('affiche tous les champs du formulaire de livraison', async () => {
    render(<Checkout />)
    await waitForDeliveryForm()
    expect(screen.getByLabelText('Prénom *')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom *')).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Téléphone *')).toBeInTheDocument()
    expect(screen.getByLabelText('Ville *')).toBeInTheDocument()
  })

  it('le bouton "Continuer" est désactivé si les champs requis sont vides', async () => {
    render(<Checkout />)
    await waitForDeliveryForm()
    expect(screen.getByRole('button', { name: /continuer vers le paiement/i })).toBeDisabled()
  })

  it('active le bouton "Continuer" quand tous les champs requis sont remplis', async () => {
    const user = userEvent.setup()
    render(<Checkout />)
    await waitForDeliveryForm()

    await user.type(screen.getByLabelText('Prénom *'), 'Alice')
    await user.type(screen.getByLabelText('Nom *'), 'Dupont')
    await user.type(screen.getByLabelText('Téléphone *'), '0102030405')
    await user.type(screen.getByLabelText('Ville *'), 'Paris')

    expect(screen.getByRole('button', { name: /continuer vers le paiement/i })).toBeEnabled()
  })
})

// ── Options de livraison ───────────────────────────────────────────────────
describe('Checkout — options de livraison', () => {
  it('affiche les options de livraison chargées depuis l\'API', async () => {
    render(<Checkout />)
    await waitFor(() => {
      expect(screen.getByText('Standard')).toBeInTheDocument()
      expect(screen.getByText('Express')).toBeInTheDocument()
    })
  })

  it('affiche le titre "Mode de livraison"', async () => {
    render(<Checkout />)
    await waitFor(() => {
      expect(screen.getByText(/mode de livraison/i)).toBeInTheDocument()
    })
  })
})

// ── Récapitulatif de commande ──────────────────────────────────────────────
describe('Checkout — récapitulatif', () => {
  it('affiche le titre "Ma commande"', async () => {
    render(<Checkout />)
    await waitFor(() => {
      expect(screen.getByText(/ma commande/i)).toBeInTheDocument()
    })
  })

  it('affiche le sous-total de la commande', async () => {
    render(<Checkout />)
    await waitFor(() => {
      // subtotal = 90000 → "90 000 FCFA"
      expect(screen.getByText(/90[\s ]000 FCFA/)).toBeInTheDocument()
    })
  })

  it('affiche le total TTC', async () => {
    render(<Checkout />)
    await waitFor(() => {
      // total = 93000 → "93 000 FCFA"
      expect(screen.getAllByText(/93[\s ]000 FCFA/)[0]).toBeInTheDocument()
    })
  })
})

// ── Étape 1 : Paiement ────────────────────────────────────────────────────
describe('Checkout — formulaire de paiement', () => {
  it('avance vers le formulaire de paiement après soumission de l\'adresse', async () => {
    const user = userEvent.setup()
    render(<Checkout />)
    await advanceToPayment(user)
    expect(screen.getByRole('heading', { name: /informations de paiement/i })).toBeInTheDocument()
  })

  it('affiche tous les champs du formulaire de paiement', async () => {
    const user = userEvent.setup()
    render(<Checkout />)
    await advanceToPayment(user)
    expect(screen.getByLabelText('Nom sur la carte')).toBeInTheDocument()
    expect(screen.getByLabelText('Numéro de carte')).toBeInTheDocument()
    expect(screen.getByLabelText("Date d'expiration")).toBeInTheDocument()
    expect(screen.getByLabelText('CVV')).toBeInTheDocument()
  })

  it('affiche le bouton de paiement avec le montant total', async () => {
    const user = userEvent.setup()
    render(<Checkout />)
    await advanceToPayment(user)
    // "Payer 93 000 FCFA"
    expect(screen.getByRole('button', { name: /payer.*93[\s ]000.*FCFA/i })).toBeInTheDocument()
  })
})

// ── Paiement ───────────────────────────────────────────────────────────────
describe('Checkout — traitement du paiement', () => {
  it('navigue vers /order-confirmation après un paiement réussi', async () => {
    const user = userEvent.setup()
    render(<Checkout />)
    await advanceToPayment(user)

    await user.type(screen.getByLabelText('Nom sur la carte'), 'ALICE DUPONT')
    await user.type(screen.getByLabelText('Numéro de carte'), '4111111111111111')
    await user.type(screen.getByLabelText("Date d'expiration"), '12/28')
    await user.type(screen.getByLabelText('CVV'), '123')

    await user.click(screen.getByRole('button', { name: /payer/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/order-confirmation',
        expect.objectContaining({ state: { orderId: 42 } })
      )
    })
  })

  it('affiche une erreur si la carte est refusée (402)', async () => {
    const user = userEvent.setup()
    render(<Checkout />)
    await advanceToPayment(user)

    await user.type(screen.getByLabelText('Nom sur la carte'), 'TEST USER')
    // La carte '0000000000000000' déclenche une erreur 402 dans le handler MSW
    await user.type(screen.getByLabelText('Numéro de carte'), '0000000000000000')
    await user.type(screen.getByLabelText("Date d'expiration"), '12/28')
    await user.type(screen.getByLabelText('CVV'), '000')

    await user.click(screen.getByRole('button', { name: /payer/i }))

    await waitFor(() => {
      expect(screen.getByText(/paiement refusé/i)).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalledWith('/order-confirmation', expect.anything())
  })
})

// ── Progression ────────────────────────────────────────────────────────────
describe('Checkout — barre de progression', () => {
  it('affiche les 3 étapes de progression', async () => {
    render(<Checkout />)
    await waitFor(() => {
      // "Livraison" apparaît aussi dans le résumé (label de livraison) → getAllByText
      expect(screen.getAllByText('Livraison')[0]).toBeInTheDocument()
      expect(screen.getByText('Paiement')).toBeInTheDocument()
      expect(screen.getByText('Confirmation')).toBeInTheDocument()
    })
  })

  it('affiche le bouton "Retour au panier"', async () => {
    render(<Checkout />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retour au panier/i })).toBeInTheDocument()
    })
  })

  it('navigue vers /cart au clic sur "Retour au panier"', async () => {
    const user = userEvent.setup()
    render(<Checkout />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retour au panier/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /retour au panier/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/cart')
  })
})
