import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { encodeConfiguration, initialConfiguration } from '../../src/lib/playground'

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

test('shows a coupon only on an allowed explicit action and resets the demo', async ({ page }) => {
  await page.goto('playground/')
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true')
  const coupon = page.getByRole('region', { name: 'Coupon preview' })
  await expect(coupon).toHaveCount(0)
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await expect(coupon).toBeVisible()
  await page.getByRole('button', { name: 'Close coupon', exact: true }).click()
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await expect(coupon).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await expect(coupon).toBeVisible()
})

test('runs the lightweight landing-page coupon demo without automatic consumption', async ({ page }) => {
  await page.goto('')
  await expect(page.locator('fatigue-coupon-demo')).toHaveAttribute('data-ready', 'true')
  const coupon = page.getByRole('region', { name: 'Coupon preview' })
  await expect(coupon).toBeHidden()
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await expect(coupon).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('landing-demo.png'), fullPage: true })
  await page.getByRole('button', { name: 'Close coupon', exact: true }).click()
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await expect(coupon).toBeHidden()
  await page.getByRole('button', { name: 'Advance to next available', exact: true }).click()
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await expect(coupon).toBeVisible()
})

test('provides persistent browser code and a manual share fallback when clipboard access fails', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Clipboard blocked')) },
      configurable: true,
    })
  })
  await page.goto('playground/')
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true')
  await expect(page.getByLabel('Generated TypeScript')).toContainText('localStorageAdapter()')
  await page.getByRole('button', { name: 'Copy share link' }).click()
  await expect(page.getByText('Clipboard unavailable. Copy the link or code below.')).toBeVisible()
  await expect(page.getByLabel('Share link', { exact: true })).toHaveValue(/config=/)
  await expect(page.getByRole('button', { name: 'Link copied' })).toHaveCount(0)
})

test('serves one usable social image on standalone and documentation pages in both languages', async ({ page }) => {
  for (const path of ['', 'docs/', 'zh-cn/', 'zh-cn/docs/']) {
    await page.goto(path)
    const meta = page.locator('meta[property="og:image"]')
    await expect(meta).toHaveCount(1)
    const url = await meta.getAttribute('content')
    expect(url).toBe('https://sorayama.github.io/fatigue-kit/social-preview.png')
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  }
  const response = await page.request.get('/fatigue-kit/social-preview.png')
  expect(response.ok()).toBe(true)
  const png = await response.body()
  expect(png.readUInt32BE(16)).toBe(1280)
  expect(png.readUInt32BE(20)).toBe(640)
})

test('connects the Chinese landing page to actionable integration and adoption feedback', async ({ page }) => {
  await page.goto('zh-cn/')
  await page.getByRole('link', { name: '接入求助与使用反馈', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: '求助与反馈' })).toBeVisible()
  await expect(page.getByRole('link', { name: '接入求助或报告问题', exact: true })).toHaveAttribute('href', /template=bug-report\.yml/)
  await expect(page.getByRole('link', { name: '分享使用反馈', exact: true })).toHaveAttribute('href', /template=adoption-feedback\.yml/)
})

test('analytics remains disabled without configuration', async ({ page }) => {
  test.skip(process.env.FATIGUE_TEST_ANALYTICS === '1', 'This run uses a configured mock tracker')
  await page.goto('playground/')
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('#fatigue-umami')).toHaveCount(0)
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  expect(await page.evaluate(() => window.fatigueAnalyticsEnabled)).not.toBe(true)
})

test('recovers from no active rules and rejects unsafe imported timestamps', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('playground/')
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true')
  for (const label of ['Calendar limit', 'Sliding window', 'Cooldown']) {
    await page.getByLabel(label, { exact: true }).uncheck()
  }
  await expect(page.getByText('Enable at least one rule to run the demo.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try consume', exact: true })).toBeDisabled()
  const config = encodeConfiguration({ ...initialConfiguration, calendarEnabled: false, windowEnabled: false, cooldownEnabled: false })
  await page.goto(`playground/?config=${config}`)
  await expect(page.getByText('Enable at least one rule to run the demo.')).toBeVisible()
  await page.getByLabel('Calendar limit', { exact: true }).check()
  await page.getByLabel('Record JSON').fill('{"v":1,"hits":[1e100],"lifetime":1}')
  await page.getByRole('button', { name: 'Import record', exact: true }).click()
  await expect(page.getByText('Invalid record JSON', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Coupon preview' })).toBeVisible()
  expect(errors).toEqual([])
})

test('analytics filters shared state and tracks only explicit successful actions on both layouts', async ({ page, context }) => {
  test.skip(process.env.FATIGUE_TEST_ANALYTICS !== '1', 'Requires the configured mock tracker run')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const payloads: Record<string, unknown>[] = []
  let documentLoads = 0
  page.on('request', (request) => {
    if (request.resourceType() === 'document') documentLoads += 1
  })
  await page.route('https://analytics.example.test/api/send', async (route) => {
    payloads.push(route.request().postDataJSON())
    await route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{}' })
  })
  await page.route('https://analytics.example.test/script.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `window.umami = { track(name, data) {
      const payload = window.fatigueBeforeSend('event', {
        url: location.href, referrer: 'https://example.org/private-user?token=secret',
        title: document.title, name, data
      });
      return payload ? fetch('https://analytics.example.test/api/send', {
        method: 'POST', body: JSON.stringify(payload)
      }) : Promise.resolve();
    }};`,
  }))
  const config = encodeConfiguration({ ...initialConfiguration, key: 'private-customer-42' })
  await page.goto(`playground/?config=${config}&utm_source=juejin&utm_campaign=launch_2026q4`)
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true')
  // Vite may reload once while optimizing the React island on first boot.
  // Each actual document load must produce exactly one pageview and no action event.
  expect(documentLoads).toBeGreaterThan(0)
  await expect.poll(() => payloads.length).toBe(documentLoads)
  expect(payloads[0]?.name).toBeUndefined()
  expect(payloads[0]?.hostname).toBe('127.0.0.1')
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await page.getByRole('button', { name: 'Try consume', exact: true }).click()
  await page.getByRole('button', { name: 'Copy Web code', exact: true }).click()
  await page.getByRole('button', { name: 'Copy install command', exact: true }).click()
  await expect.poll(() => payloads.filter((payload) => payload.name === 'code_copy').length).toBe(1)
  await expect.poll(() => payloads.filter((payload) => payload.name === 'install_copy').length).toBe(1)
  expect(payloads.filter((payload) => payload.name === 'demo_interact')).toHaveLength(3)
  expect(payloads.filter((payload) => payload.name === 'demo_complete')).toHaveLength(1)
  expect(JSON.stringify(payloads)).not.toMatch(/config=|private-customer|private-user|secret|"record"|"key"/)
  expect(payloads[0]?.url).toContain('utm_source=juejin')
  await page.goto('docs/')
  await expect.poll(() => payloads.filter((payload) => payload.name === undefined).length).toBe(documentLoads)
  expect(payloads.at(-1)?.url).toBe('/fatigue-kit/docs/')
})
