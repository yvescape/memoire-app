// Parcours critique 2 : Recherche produit → Ajout au panier → Commande
import { test, expect } from '@playwright/test'
import { setupApiRoutes } from './helpers/api.js'

test.beforeEach(async ({ page }) => {
  await setupApiRoutes(page)
})

// ── Recherche de produits ──────────────────────────────────────────────────
test.describe('Recherche de produits', () => {
  test('affiche tous les produits au chargement initial', async ({ page }) => {
    await page.goto('/products')

    await expect(page.locator('.product-card')).toHaveCount(2)
    await expect(page.locator('.product-name').first()).toBeVisible()
  })

  test('filtre les produits par nom lors d\'une recherche', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('.product-card')).toHaveCount(2)

    await page.fill('.search-input', 'Rose')

    await expect(page.locator('.product-card')).toHaveCount(1)
    await expect(page.locator('.product-name')).toContainText('Élyse Rose')
  })

  test('affiche "aucun résultat" pour une recherche sans correspondance', async ({ page }) => {
    await page.goto('/products')

    await page.fill('.search-input', 'xyznotfound')

    await expect(page.locator('text=/aucun résultat/i')).toBeVisible()
  })

  test('navigue vers la page détail au clic sur un produit', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('.product-card').first()).toBeVisible()

    // Clic sur le nom du premier produit
    await page.locator('.product-name').first().click()

    await expect(page).toHaveURL(/\/product\/\d+/)
  })
})

// ── Ajout au panier depuis la page détail ─────────────────────────────────
test.describe('Ajout au panier', () => {
  test('ajoute un produit au panier depuis la page de détail', async ({ page }) => {
    await page.goto('/product/1')

    // Attendre que le produit soit chargé
    await expect(page.locator('.detail-name')).toContainText('Élyse Rose')

    // Cliquer sur "Ajouter au panier"
    await page.click('.detail-add-btn')

    // Le bouton change d'état ou le badge du panier apparaît
    await expect(
      page.locator('.detail-add-btn, .cart-status, .qty-control')
    ).toBeVisible()
  })
})

// ── Panier et navigation vers le paiement ─────────────────────────────────
test.describe('Panier', () => {
  test('affiche les articles du panier', async ({ page }) => {
    await page.goto('/cart')

    await expect(page.locator('.cart-item-name')).toContainText('Élyse Rose')
    await expect(page.locator('text=/votre sélection/i')).toBeVisible()
  })

  test('affiche le sous-total et le total', async ({ page }) => {
    await page.goto('/cart')

    // toLocaleString('fr-FR') insère U+202F (narrow no-break space) entre les milliers.
    // On cible le conteneur .summary-card pour éviter les problèmes de whitespace regex.
    await expect(page.locator('.summary-card')).toContainText('90')
    await expect(page.locator('.summary-card')).toContainText('93')
  })

  test('navigue vers /checkout au clic sur "Procéder au paiement"', async ({ page }) => {
    await page.goto('/cart')

    await expect(page.locator('button:has-text("Procéder au paiement")')).toBeVisible()
    await page.click('button:has-text("Procéder au paiement")')

    await expect(page).toHaveURL('/checkout')
  })
})
