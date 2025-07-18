import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Payload Blank Template/)

    const headging = page.locator('h1').first()

    await expect(headging).toHaveText('Welcome to your new project.')
  })
})
