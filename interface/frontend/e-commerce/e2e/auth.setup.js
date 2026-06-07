// Exécuté par le projet "setup" de Playwright.
// Se connecte une seule fois via l'UI (API mockée) et sauvegarde
// le localStorage dans e2e/.auth/user.json — réutilisé par le projet "chromium".
import { test as setup } from '@playwright/test'
import { setupApiRoutes } from './helpers/api.js'

const AUTH_FILE = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await setupApiRoutes(page)

  await page.goto('/login')

  await page.getByLabel('Adresse e-mail').fill('alice@test.com')
  await page.getByLabel('Mot de passe').fill('password123')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await page.waitForURL('/')

  await page.context().storageState({ path: AUTH_FILE })
})