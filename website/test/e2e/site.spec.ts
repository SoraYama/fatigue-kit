import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('navigates docs without broken base or locale paths', async ({ page, isMobile }) => {
  await page.goto('docs/')
  if (isMobile) await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('link', { name: 'Quick start' }).first().click()
  await expect(page).toHaveURL(/\/fatigue-kit\/docs\/quick-start\/$/)
  await expect(page.getByRole('heading', { name: 'Quick start', level: 1 })).toBeVisible()
  if (isMobile) await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('link', { name: 'Sliding windows' }).click()
  await expect(page.getByRole('heading', { name: 'Sliding windows', level: 1 })).toBeVisible()
})

test('switches locale to Simplified Chinese', async ({ page, isMobile }) => {
  await page.goto('docs/')
  if (isMobile) await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Menu' }).click()
  const scope = isMobile ? page.getByRole('navigation', { name: 'Main' }) : page.getByRole('banner')
  await scope.getByLabel('Select language').selectOption('/fatigue-kit/zh-cn/docs/')
  await expect(page).toHaveURL(/\/zh-cn\/docs\/$/)
  await expect(page.getByRole('heading', { name: '介绍', level: 1 })).toBeVisible()
})

test('operates and restores a shared playground configuration', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('playground/')
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true')
  await expect(page.getByLabel('Lifetime limit')).not.toBeChecked()
  await page.getByLabel('Lifetime limit').click()
  await expect(page.getByLabel('Lifetime limit')).toBeChecked()
  await page.getByRole('button', { name: 'Try consume' }).click()
  await expect(page.getByText('Denied', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Copy share link' }).click()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toContain('config=')
  await page.goto(link)
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true')
  await expect(page.getByLabel('Lifetime limit')).toBeChecked()
})

test('supports keyboard focus and has no serious accessibility violations', async ({ page }) => {
  await page.goto('playground/')
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus-visible')).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([])
})
