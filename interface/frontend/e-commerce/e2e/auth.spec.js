// Parcours critique 1 : Inscription → Connexion → Déconnexion
import { test, expect } from '@playwright/test'
import { setupApiRoutes } from './helpers/api.js'

test.beforeEach(async ({ page }) => {
  await setupApiRoutes(page)
})

// ── Inscription ────────────────────────────────────────────────────────────
test.describe('Inscription', () => {
  test('crée un compte et redirige vers /login', async ({ page }) => {
    await page.goto('/register')

    await page.fill('#reg-firstName', 'Alice')
    await page.fill('#reg-lastName', 'Dupont')
    await page.fill('#reg-email', 'alice.new@test.com')
    await page.fill('#reg-password', 'SecretPass123!')
    await page.fill('#reg-confirm', 'SecretPass123!')
    await page.locator('input[type="checkbox"]').check()

    await page.click('button:has-text("Créer mon compte")')

    await expect(page).toHaveURL('/login')
  })

  test('affiche une erreur si l\'email est déjà utilisé', async ({ page }) => {
    await page.goto('/register')

    await page.fill('#reg-firstName', 'Bob')
    await page.fill('#reg-lastName', 'Martin')
    await page.fill('#reg-email', 'existing@test.com')
    await page.fill('#reg-password', 'SecretPass123!')
    await page.fill('#reg-confirm', 'SecretPass123!')
    await page.locator('input[type="checkbox"]').check()

    await page.click('button:has-text("Créer mon compte")')

    // L'API renvoie 400 avec un message sur l'email (deux éléments possibles → .first())
    await expect(page.locator('.field-error, .auth-error').first()).toContainText(/déjà/i)
  })
})

// ── Connexion ──────────────────────────────────────────────────────────────
test.describe('Connexion', () => {
  test('connexion réussie redirige vers l\'accueil et stocke les tokens', async ({ page }) => {
    await page.goto('/login')

    await page.fill('#login-email', 'alice@test.com')
    await page.fill('#login-password', 'password123')
    await page.click('button:has-text("Se connecter")')

    await expect(page).toHaveURL('/')

    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'))
    expect(accessToken).toBeTruthy()
  })

  test('affiche une erreur si le mot de passe est incorrect', async ({ page }) => {
    await page.goto('/login')

    await page.fill('#login-email', 'alice@test.com')
    await page.fill('#login-password', 'wrongpassword')
    await page.click('button:has-text("Se connecter")')

    await expect(page.locator('.auth-error')).toContainText(/identifiants incorrects/i)
    await expect(page).toHaveURL('/login')
  })
})

// ── Déconnexion ────────────────────────────────────────────────────────────
test.describe('Déconnexion', () => {
  test('efface les tokens et ferme la session', async ({ page }) => {
    // Connexion
    await page.goto('/login')
    await page.fill('#login-email', 'alice@test.com')
    await page.fill('#login-password', 'password123')
    await page.click('button:has-text("Se connecter")')
    await expect(page).toHaveURL('/')

    // Ouvrir le menu utilisateur dans le header
    await page.locator('.account-icon').click()
    // Cibler le bouton desktop uniquement (le mobile a aussi un bouton "Déconnexion")
    await page.locator('.user-dropdown-logout').click()

    // Les tokens doivent être supprimés du localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'))
    expect(accessToken).toBeNull()
  })
})
