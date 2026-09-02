import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'
import { adminUrl, getAdminRoute } from '@/utilities/adminRoute'

const serverURL = 'http://localhost:3000'
const adminRoute = getAdminRoute()

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto(`${serverURL}${adminRoute}`)
    await expect(page).toHaveURL(`${serverURL}${adminRoute}`)
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto(`${serverURL}${adminUrl('collections', 'users')}`)
    await expect(page).toHaveURL(`${serverURL}${adminUrl('collections', 'users')}`)
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto(`${serverURL}${adminUrl('collections', 'users', 'create')}`)
    await expect(page).toHaveURL(
      new RegExp(`${adminRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/collections/users/[a-zA-Z0-9-_]+`),
    )
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
