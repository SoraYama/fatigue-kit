import { createFatigue } from 'fatigue-kit'
import { localStorageAdapter } from 'fatigue-kit/adapters/local-storage'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  decodeConfiguration,
  encodeConfiguration,
  formatLocalDateTime,
  generateCode,
  initialConfiguration,
  toRules,
} from './playground'

afterEach(() => vi.unstubAllGlobals())

describe('playground configuration', () => {
  it('converts every v1 rule primitive', () => {
    const rules = toRules({ ...initialConfiguration, lifetimeEnabled: true })
    expect(rules).toEqual([
      { max: 1, every: 'day', cutoff: '00:00', weekStartsOn: 1 },
      { max: 3, window: '7d' },
      { cooldown: '4h' },
      { max: 5 },
    ])
  })

  it('roundtrips a versioned Unicode-safe share configuration', () => {
    const input = { ...initialConfiguration, key: '优惠弹窗', calendarPeriod: 'month' as const }
    expect(decodeConfiguration(encodeConfiguration(input))).toEqual(input)
  })

  it('safely rejects corrupt and future configurations', () => {
    expect(decodeConfiguration('not-base64')).toEqual(initialConfiguration)
    const future = encodeConfiguration({ ...initialConfiguration, version: 1 })
    const decoded = decodeConfiguration(future)
    expect(decoded.version).toBe(1)
  })

  it('generates executable-looking TypeScript from public APIs', () => {
    expect(generateCode(initialConfiguration)).toContain("fatigue.tryConsume(\"coupon-popup\"")
    expect(generateCode(initialConfiguration)).toContain('"window": "7d"')
  })

  it('generates browser code that retains caps across engine recreation', () => {
    const records = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => records.set(key, value),
      removeItem: (key: string) => records.delete(key),
    })
    const source = generateCode(initialConfiguration).replace(/^import .*$/gm, '')
    const run = new Function('createFatigue', 'localStorageAdapter', `${source}\nreturn result`)
    expect(run(createFatigue, localStorageAdapter).allowed).toBe(true)
    expect(run(createFatigue, localStorageAdapter).allowed).toBe(false)
  })

  it('normalizes untrusted configuration before the engine and date formatter see it', () => {
    const configuration = decodeConfiguration(encodeConfiguration({
      ...initialConfiguration,
      calendarMax: 1.5,
      windowMax: -1,
      lifetimeMax: 2.5,
      cutoff: '99:99',
      now: 1e100,
      cooldownHours: 1e300,
      windowDays: 1e300,
    }))
    expect(() => new Date(configuration.now).toISOString()).not.toThrow()
    expect(() => createFatigue().peek(configuration.key, toRules(configuration))).not.toThrow()
    expect(configuration.calendarMax).toBe(1)
    expect(configuration.cutoff).toBe('00:00')
  })

  it('roundtrips the local datetime input without shifting its timezone', () => {
    const now = new Date(2026, 9, 23, 8, 30).getTime()
    expect(new Date(formatLocalDateTime(now)).getTime()).toBe(now)
  })
})
