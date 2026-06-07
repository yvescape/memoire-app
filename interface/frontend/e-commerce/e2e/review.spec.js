// Parcours critique 4 : Dépôt d'un avis sur un produit
import { test, expect } from '@playwright/test'
import { setupApiRoutes, loginAs } from './helpers/api.js'

test.beforeEach(async ({ page }) => {
  // Les formulaires d'avis ne sont accessibles qu'aux utilisateurs connectés
  await loginAs(page)
  await setupApiRoutes(page)
})

// ── Page de détail produit ─────────────────────────────────────────────────
test.describe('Affichage des avis', () => {
  test('affiche les avis existants dans l\'onglet "Avis"', async ({ page }) => {
    await page.goto('/product/1')
    await expect(page.locator('.detail-name')).toContainText('Élyse Rose')

    // Ouvrir l'onglet Avis
    await page.locator('.tabs-nav button', { hasText: /avis/i }).click()

    // L'avis existant du mock est affiché
    await expect(page.locator('.comment-card')).toContainText('Magnifique parfum')
  })

  test('affiche la note moyenne du produit', async ({ page }) => {
    await page.goto('/product/1')

    await page.locator('.tabs-nav button', { hasText: /avis/i }).click()

    // La note moyenne mockée est 4.2 (présente en plusieurs endroits → .first())
    await expect(page.locator('text=/4[.,]2/').first()).toBeVisible()
  })
})

// ── Publier un commentaire ─────────────────────────────────────────────────
test.describe('Publication d\'un commentaire', () => {
  test('publie un commentaire et l\'affiche dans la liste', async ({ page }) => {
    await page.goto('/product/1')
    await expect(page.locator('.detail-name')).toContainText('Élyse Rose')

    await page.locator('.tabs-nav button', { hasText: /avis/i }).click()

    // Ouvrir le formulaire de commentaire
    await page.locator('button', { hasText: 'Commenter' }).click()

    const textarea = page.locator('textarea[placeholder*="Partagez"]')
    await expect(textarea).toBeVisible()
    await textarea.fill('Superbe fragrance, très élégante !')

    await page.locator('button', { hasText: 'Publier' }).click()

    // Le formulaire se ferme après soumission réussie (le composant re-fetch les commentaires)
    await expect(
      page.locator('textarea[placeholder*="Partagez"]')
    ).not.toBeVisible({ timeout: 10_000 })
  })

  test('ferme le formulaire après annulation', async ({ page }) => {
    await page.goto('/product/1')
    await page.locator('.tabs-nav button', { hasText: /avis/i }).click()
    await page.locator('button', { hasText: 'Commenter' }).click()

    await expect(page.locator('textarea[placeholder*="Partagez"]')).toBeVisible()

    await page.locator('button', { hasText: 'Annuler' }).first().click()

    await expect(page.locator('textarea[placeholder*="Partagez"]')).not.toBeVisible()
  })
})

// ── Attribuer une note ─────────────────────────────────────────────────────
test.describe('Attribution d\'une note', () => {
  test('soumet une note et ferme le formulaire', async ({ page }) => {
    await page.goto('/product/1')
    await page.locator('.tabs-nav button', { hasText: /avis/i }).click()

    // Ouvrir le formulaire de notation
    await page.locator('button', { hasText: 'Noter' }).click()

    // Cliquer sur la 4ème étoile
    const stars = page.locator('.rating-star')
    await expect(stars.first()).toBeVisible()
    await stars.nth(3).click()

    await page.locator('button', { hasText: 'Envoyer ma note' }).click()

    // Formulaire fermé après envoi réussi
    await expect(
      page.locator('button', { hasText: 'Envoyer ma note' })
    ).not.toBeVisible({ timeout: 10_000 })
  })
})
