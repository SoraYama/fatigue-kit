import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveAnalyticsConfiguration, sanitizeAnalyticsPayload, trackSiteEvent } from './analytics'

const websiteId = '94db1cb1-74f4-4a40-ad6c-962362670409'
const context = { websiteId, path: '/fatigue-kit/playground/', origin: 'https://sorayama.github.io' }

afterEach(() => vi.unstubAllGlobals())

describe('optional website analytics', () => {
  it('stays disabled without configuration and rejects partial or unsafe setup', () => {
    expect(resolveAnalyticsConfiguration('', '')).toBeNull()
    expect(() => resolveAnalyticsConfiguration('https://analytics.example/script.js', '')).toThrow()
    expect(() => resolveAnalyticsConfiguration('javascript:alert(1)', websiteId)).toThrow()
    expect(() => resolveAnalyticsConfiguration('https://user:secret@example.com/script.js', websiteId)).toThrow()
    expect(resolveAnalyticsConfiguration('https://analytics.example/script.js', websiteId)).toEqual({
      scriptUrl: 'https://analytics.example/script.js', websiteId,
    })
  })

  it('keeps only controlled campaign tags and removes config, private paths and arbitrary data', () => {
    const payload = sanitizeAnalyticsPayload('event', {
      url: '/fatigue-kit/playground/?config=private-record&key=customer-42&utm_source=juejin&utm_campaign=launch_2026q4&utm_content=coupon_v1&utm_term=private-term#secret',
      referrer: 'https://example.org/private/customer-42?token=secret',
      name: 'demo_interact',
      data: { outcome: 'allowed', key: 'customer-42', record: 'private-record', email: 'private@example.org' },
      title: 'private-title',
      id: 'private-user',
    }, context)
    expect(payload).toEqual({
      website: websiteId,
      hostname: 'sorayama.github.io',
      url: '/fatigue-kit/playground/?utm_source=juejin&utm_campaign=launch_2026q4&utm_content=coupon_v1',
      referrer: 'https://example.org',
      title: 'fatigue-kit',
      language: 'en',
      name: 'demo_interact',
      data: { surface: 'playground', locale: 'en', outcome: 'allowed' },
    })
    expect(JSON.stringify(payload)).not.toMatch(/private|customer|secret/)
  })

  it('drops unknown events, identification, and unapproved UTM values', () => {
    expect(sanitizeAnalyticsPayload('identify', { id: 'user' }, context)).toBe(false)
    expect(sanitizeAnalyticsPayload('event', { name: 'customer-42' }, context)).toBe(false)
    const payload = sanitizeAnalyticsPayload('event', { url: '/?utm_source=customer-42&utm_medium=private-medium&utm_campaign=private-campaign&utm_content=private-content&config=secret', referrer: 'not a URL' }, context)
    expect(payload).toMatchObject({ url: context.path, referrer: '' })
  })

  it.each([
    ['javascriptweekly', 'newsletter'],
    ['reactstatus', 'newsletter'],
    ['reactiflux', 'community'],
    ['hashnode', 'article'],
    ['producthunt', 'community'],
    ['reddit_javascript', 'community'],
    ['reddit_reactjs', 'community'],
    ['reddit_opensource', 'community'],
    ['reddit_developersindia', 'community'],
    ['awesome_javascript', 'referral'],
    ['awesome_react', 'referral'],
    ['lobsters', 'community'],
  ])('preserves %s attribution while removing private share state', (source, medium) => {
    const payload = sanitizeAnalyticsPayload('event', {
      url: `/?utm_source=${source}&utm_medium=${medium}&utm_campaign=launch_2026q4&utm_content=coupon_v1&config=private-record&key=private-user#private-hash`,
      name: 'example_open',
      data: { key: 'private-user', record: 'private-record' },
    }, context)
    expect(payload).toMatchObject({
      url: `${context.path}?utm_source=${source}&utm_medium=${medium}&utm_campaign=launch_2026q4&utm_content=coupon_v1`,
      data: { surface: 'playground', locale: 'en' },
    })
    expect(JSON.stringify(payload)).not.toContain('private')
  })

  it('uses the built page path and locale instead of user-controlled URL paths', () => {
    expect(sanitizeAnalyticsPayload('event', { url: '/private-user?config=secret' }, {
      ...context, path: '/fatigue-kit/zh-cn/docs/api/react/',
    })).toMatchObject({ url: '/fatigue-kit/zh-cn/docs/api/react/', language: 'zh-CN' })
  })

  it('does not track when disabled or let tracker errors affect the interface', () => {
    const track = vi.fn(() => { throw new Error('Tracker failed') })
    vi.stubGlobal('window', { umami: { track }, fatigueAnalyticsEnabled: false })
    trackSiteEvent('code_copy')
    expect(track).not.toHaveBeenCalled()
    window.fatigueAnalyticsEnabled = true
    expect(() => trackSiteEvent('code_copy')).not.toThrow()
    expect(track).toHaveBeenCalledOnce()
  })
})
