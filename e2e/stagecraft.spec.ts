import { expect, test } from '@playwright/test'

async function dismissOnboarding(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('stagecraft-onboarded', '1')
  })
}

test.describe('Stagecraft', () => {
  test('loads with DG formatted preview', async ({ page }) => {
    await dismissOnboarding(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Stagecraft' })).toBeVisible()
    await expect(page.getByText('Formatted Preview')).toBeVisible()
    await expect(page.locator('.cast-page, .script-page-body').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('shows cast of characters in sidebar', async ({ page }) => {
    await dismissOnboarding(page)
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto('/')
    await page.getByRole('tab', { name: 'Cast' }).click()
    await expect(page.getByText('MARCUS').first()).toBeVisible()
  })

  test('export menu opens', async ({ page }) => {
    await dismissOnboarding(page)
    await page.goto('/')
    await page.getByRole('button', { name: /Export/ }).click()
    await expect(page.getByRole('button', { name: '.pdf' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submission ZIP' })).toBeVisible()
  })
})
