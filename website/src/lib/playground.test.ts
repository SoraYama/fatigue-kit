import { describe, expect, it } from 'vitest'
import {
  decodeConfiguration,
  encodeConfiguration,
  generateCode,
  initialConfiguration,
  toRules,
} from './playground'

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
})
