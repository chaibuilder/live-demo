import { expect, test } from '@playwright/test'
import { adminUrl, getAdminRoute } from '@/utilities/adminRoute'

const serverURL = 'http://localhost:3000'
const adminRoute = getAdminRoute()

test.describe('Password reset UI', () => {
  test('login page links to forgot password form', async ({ page }) => {
    await page.goto(`${serverURL}${adminUrl('login')}`)

    const forgotLink = page.getByRole('link', { name: /forgot/i })
    await expect(forgotLink).toBeVisible()
    await forgotLink.click()

    await expect(page).toHaveURL(new RegExp(`${adminRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/forgot`))
    await expect(page.getByRole('heading', { name: /forgot/i })).toBeVisible()
  })

  test('forgot password form accepts email submission', async ({ page }) => {
    await page.goto(`${serverURL}${adminUrl('forgot')}`)

    await page.fill('#field-email', 'dev@chaibuilder.com')
    await page.click('button[type="submit"]')

    // Payload shows success even when email unknown — assert no hard error UI
    await expect(page.locator('.form-submit button')).toBeEnabled()
  })
})
