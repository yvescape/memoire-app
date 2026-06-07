// Parcours critique 5 : Consultation du statut de commande (page de confirmation)
// Note : la page /orders (historique complet) est en cours de développement.
// Ce fichier couvre le statut post-achat via /order-confirmation et le flux
// complet checkout → confirmation, qui valide le parcours de bout en bout.
import { test, expect } from '@playwright/test'
import { setupApiRoutes } from './helpers/api.js'

test.beforeEach(async ({ page }) => {
  await setupApiRoutes(page)
})

// ── Page de confirmation de commande ──────────────────────────────────────
test.describe('Confirmation de commande', () => {
  test('affiche le titre et le statut "Commande reçue"', async ({ page }) => {
    await page.goto('/order-confirmation')

    await expect(page.locator('.confirm-title')).toBeVisible()
    await expect(page.locator('text=Commande confirmée')).toBeVisible()
    await expect(page.locator('text=Commande reçue')).toBeVisible()
  })

  test('affiche un numéro de commande au format PF-XXXXX', async ({ page }) => {
    await page.goto('/order-confirmation')

    // Le numéro de commande est généré côté client au format PF-\d{5}
    const orderNumber = page.locator('.confirm-card-value').first()
    await expect(orderNumber).toBeVisible()
    await expect(orderNumber).toHaveText(/PF-\d{5}/)
  })

  test('affiche la date du jour', async ({ page }) => {
    await page.goto('/order-confirmation')

    // La date est formatée en fr-FR (ex: "9 mai 2026")
    const year = new Date().getFullYear().toString()
    await expect(page.locator('.confirm-card-value').nth(1)).toContainText(year)
  })

  test('affiche le délai de livraison estimé', async ({ page }) => {
    await page.goto('/order-confirmation')

    await expect(page.locator('text=3–5 jours ouvrés')).toBeVisible()
  })

  test('affiche la timeline avec les 4 étapes', async ({ page }) => {
    await page.goto('/order-confirmation')

    await expect(page.locator('text=Commande reçue')).toBeVisible()
    await expect(page.locator('text=En préparation')).toBeVisible()
    await expect(page.locator('text=Expédiée')).toBeVisible()
    await expect(page.locator('text=Livrée')).toBeVisible()
  })
})

// ── Navigation depuis la confirmation ─────────────────────────────────────
test.describe('Navigation post-confirmation', () => {
  test('navigue vers /products au clic sur "Continuer les achats"', async ({ page }) => {
    await page.goto('/order-confirmation')

    await page.click('button:has-text("Continuer les achats")')

    await expect(page).toHaveURL('/products')
    await expect(page.locator('.product-card').first()).toBeVisible()
  })

  test('affiche le bouton "Retour à l\'accueil"', async ({ page }) => {
    await page.goto('/order-confirmation')

    // Le bouton est présent (la navigation dépend de l'implémentation React Router)
    await expect(page.locator('button:has-text("Retour à l\'accueil")')).toBeVisible()
  })
})

// ── Parcours complet checkout → confirmation ───────────────────────────────
test.describe('Flux complet : paiement → confirmation', () => {
  test('l\'achat aboutit à la page de confirmation avec le bon statut', async ({ page }) => {
    await page.goto('/checkout')

    // Étape livraison
    await expect(page.locator('#co-firstName')).toBeVisible()
    await page.fill('#co-firstName', 'Alice')
    await page.fill('#co-lastName', 'Dupont')
    await page.fill('#co-phone', '0102030405')
    await page.fill('#co-city', 'Paris')
    await page.click('button:has-text("Continuer vers le paiement")')

    // Étape paiement
    await expect(page.locator('#co-cardNumber')).toBeVisible()
    await page.fill('#co-cardName', 'ALICE DUPONT')
    await page.locator('#co-cardNumber').pressSequentially('4111111111111111')
    await page.fill('#co-expiry', '12/28')
    await page.fill('#co-cvv', '123')
    await page.click('button:has-text("Payer")')

    // Confirmation
    await expect(page).toHaveURL('/order-confirmation', { timeout: 10_000 })
    await expect(page.locator('text=Commande confirmée')).toBeVisible()
    await expect(page.locator('text=Commande reçue')).toBeVisible()
  })
})
