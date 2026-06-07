// Parcours critique 3 : Paiement (succès + échec)
import { test, expect } from '@playwright/test'
import { setupApiRoutes } from './helpers/api.js'

// ── Helper : remplir le formulaire de livraison ────────────────────────────
async function fillDelivery(page) {
  await expect(page.locator('#co-firstName')).toBeVisible({ timeout: 10_000 })
  await page.fill('#co-firstName', 'Alice')
  await page.fill('#co-lastName', 'Dupont')
  await page.fill('#co-phone', '0102030405')
  await page.fill('#co-city', 'Paris')
  await page.click('button:has-text("Continuer vers le paiement")')
  await expect(page.locator('#co-cardNumber')).toBeVisible({ timeout: 10_000 })
}

test.beforeEach(async ({ page }) => {
  await setupApiRoutes(page)
  await page.goto('/checkout')
})

// ── Formulaire de livraison ────────────────────────────────────────────────
test.describe('Formulaire de livraison', () => {
  test('affiche le formulaire d\'adresse après chargement', async ({ page }) => {
    await expect(page.locator('#co-firstName')).toBeVisible()
    await expect(page.locator('#co-lastName')).toBeVisible()
    await expect(page.locator('#co-phone')).toBeVisible()
    await expect(page.locator('#co-city')).toBeVisible()
  })

  test('le bouton "Continuer" est désactivé tant que les champs requis sont vides', async ({ page }) => {
    await expect(page.locator('#co-firstName')).toBeVisible()
    await expect(
      page.locator('button:has-text("Continuer vers le paiement")')
    ).toBeDisabled()
  })

  test('affiche les options de livraison Standard et Express', async ({ page }) => {
    await expect(page.locator('text=Standard')).toBeVisible()
    await expect(page.locator('text=Express')).toBeVisible()
  })

  test('affiche le total de la commande dans le récapitulatif', async ({ page }) => {
    // toLocaleString('fr-FR') utilise U+202F (narrow no-break space) → \W le capture
    await expect(page.locator('text=/93\\W000/').first()).toBeVisible()
  })
})

// ── Paiement réussi ────────────────────────────────────────────────────────
test.describe('Paiement réussi', () => {
  test('navigue vers /order-confirmation après un paiement valide', async ({ page }) => {
    await fillDelivery(page)

    await page.fill('#co-cardName', 'ALICE DUPONT')
    // Saisie caractère par caractère pour déclencher le formateur du composant
    await page.locator('#co-cardNumber').pressSequentially('4111111111111111')
    await page.fill('#co-expiry', '12/28')
    await page.fill('#co-cvv', '123')

    await page.click('button:has-text("Payer")')

    await expect(page).toHaveURL('/order-confirmation', { timeout: 10_000 })
    await expect(page.locator('.confirm-title')).toBeVisible()
  })

  test('la page de confirmation affiche "Commande confirmée"', async ({ page }) => {
    await fillDelivery(page)

    await page.fill('#co-cardName', 'ALICE DUPONT')
    await page.locator('#co-cardNumber').pressSequentially('4111111111111111')
    await page.fill('#co-expiry', '12/28')
    await page.fill('#co-cvv', '123')
    await page.click('button:has-text("Payer")')

    await expect(page).toHaveURL('/order-confirmation', { timeout: 10_000 })
    await expect(page.locator('text=Commande confirmée')).toBeVisible()
    await expect(page.locator('text=Commande reçue')).toBeVisible()
  })
})

// ── Paiement refusé ────────────────────────────────────────────────────────
test.describe('Paiement refusé', () => {
  test('affiche un message d\'erreur pour une carte refusée (402)', async ({ page }) => {
    await fillDelivery(page)

    await page.fill('#co-cardName', 'TEST USER')
    // La carte 0000000000000000 déclenche une erreur 402 côté API
    await page.locator('#co-cardNumber').pressSequentially('0000000000000000')
    await page.fill('#co-expiry', '12/28')
    await page.fill('#co-cvv', '000')

    await page.click('button:has-text("Payer")')

    await expect(page.locator('text=/paiement refusé/i')).toBeVisible({ timeout: 10_000 })
    await expect(page).not.toHaveURL('/order-confirmation')
  })

  test('reste sur /checkout après un paiement refusé', async ({ page }) => {
    await fillDelivery(page)

    await page.fill('#co-cardName', 'TEST USER')
    await page.locator('#co-cardNumber').pressSequentially('0000000000000000')
    await page.fill('#co-expiry', '12/28')
    await page.fill('#co-cvv', '000')
    await page.click('button:has-text("Payer")')

    await expect(page.locator('text=/paiement refusé/i')).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL('/checkout')
  })
})
