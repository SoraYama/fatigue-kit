import { describe, expect, it } from 'vitest'
import { memoryAdapter } from '../src/adapters/memory'
import { createFatigue } from '../src/engine'
import { at, FakeClock } from './helpers'

const HOUR = 3_600_000
const DAY = 86_400_000

function setup(options?: Parameters<typeof createFatigue>[0]) {
	const clock = new FakeClock()
	const storage = memoryAdapter()
	const fatigue = createFatigue({ clock, storage, ...options })
	return { clock, storage, fatigue }
}

describe('sliding window rule', () => {
	it('allows up to max, then frees slots as hits roll off', () => {
		const { clock, fatigue } = setup()
		const rules = [{ max: 2, window: '1h' as const }]

		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)
		clock.advance(30 * 60 * 1000)
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)

		const denied = fatigue.tryConsume('k', rules)
		expect(denied.allowed).toBe(false)
		expect(denied.remaining).toBe(0)
		// The first slot frees when the first hit leaves the window.
		expect(denied.nextAvailableAt).toBe(HOUR)
		expect(denied.deniedBy).toEqual({ max: 2, window: '1h' })

		clock.setTo(HOUR)
		expect(fatigue.peek('k', rules)).toMatchObject({ allowed: true, remaining: 1 })
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)

		clock.advance(30 * 60 * 1000 - 1)
		expect(fatigue.peek('k', rules).allowed).toBe(false)

		clock.advance(1)
		expect(fatigue.peek('k', rules)).toMatchObject({ allowed: true, remaining: 1 })
	})

	it('treats the window as a strict duration, not calendar days', () => {
		const { clock, fatigue } = setup()
		const rules = [{ max: 1, window: DAY }]
		fatigue.tryConsume('k', rules)
		clock.advance(DAY - 1)
		expect(fatigue.peek('k', rules).allowed).toBe(false)
		expect(fatigue.peek('k', rules).nextAvailableAt).toBe(DAY)
		clock.advance(1)
		expect(fatigue.peek('k', rules).allowed).toBe(true)
	})
})

describe('cooldown rule', () => {
	it('blocks until the cooldown elapses, without limiting the count', () => {
		const { clock, fatigue } = setup()
		const rules = [{ cooldown: '4h' as const }]

		const first = fatigue.tryConsume('k', rules)
		expect(first.allowed).toBe(true)
		expect(first.remaining).toBe(Number.POSITIVE_INFINITY)

		clock.advance(4 * HOUR - 1)
		const denied = fatigue.peek('k', rules)
		expect(denied.allowed).toBe(false)
		expect(denied.nextAvailableAt).toBe(4 * HOUR)

		clock.advance(1)
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)
	})
})

describe('calendar rules', () => {
	it('resets per local calendar day', () => {
		const { clock, fatigue } = setup()
		const rules = [{ max: 1, every: 'day' as const }]

		clock.setTo(at(2026, 9, 20, 12))
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)

		const denied = fatigue.peek('k', rules)
		expect(denied.allowed).toBe(false)
		expect(denied.nextAvailableAt).toBe(at(2026, 9, 21))

		clock.setTo(at(2026, 9, 21))
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)
	})

	it('supports a cutoff, e.g. a business day starting at 04:00', () => {
		const { clock, fatigue } = setup()
		const rules = [{ max: 1, every: 'day' as const, cutoff: '04:00' as const }]

		clock.setTo(at(2026, 9, 20, 3, 0))
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)

		// 03:30 still belongs to the previous business day.
		clock.advance(30 * 60 * 1000)
		expect(fatigue.peek('k', rules).allowed).toBe(false)

		clock.advance(60 * 60 * 1000)
		expect(fatigue.peek('k', rules).allowed).toBe(true)
	})

	it('resets per week and per month', () => {
		const { clock, fatigue } = setup()
		// 2026-10-14 is a Wednesday; the week (Monday-first) ends Sunday the 18th.
		clock.setTo(at(2026, 9, 14, 12))
		expect(fatigue.tryConsume('w', [{ max: 1, every: 'week' }]).allowed).toBe(true)
		expect(fatigue.peek('w', [{ max: 1, every: 'week' }]).nextAvailableAt).toBe(at(2026, 9, 19))

		clock.setTo(at(2026, 0, 31, 12))
		expect(fatigue.tryConsume('m', [{ max: 1, every: 'month' }]).allowed).toBe(true)
		expect(fatigue.peek('m', [{ max: 1, every: 'month' }]).nextAvailableAt).toBe(at(2026, 1, 1))
	})
})

describe('lifetime rule', () => {
	it('caps the total count forever', () => {
		const { fatigue } = setup()
		const rules = [{ max: 2 }]

		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)
		const denied = fatigue.tryConsume('k', rules)
		expect(denied.allowed).toBe(false)
		expect(denied.nextAvailableAt).toBeUndefined()
		expect(denied.deniedBy).toEqual({ max: 2 })
	})
})

describe('combined rules', () => {
	it('the strictest rule wins', () => {
		const { fatigue } = setup()
		const rules = [{ max: 5, window: '1h' as const }, { max: 3 }]

		expect(fatigue.tryConsume('k', rules)).toMatchObject({ allowed: true, remaining: 2 })
		expect(fatigue.tryConsume('k', rules)).toMatchObject({ allowed: true, remaining: 1 })
		expect(fatigue.tryConsume('k', rules)).toMatchObject({ allowed: true, remaining: 0 })
		const denied = fatigue.tryConsume('k', rules)
		expect(denied.allowed).toBe(false)
		expect(denied.remaining).toBe(0)
		expect(denied.deniedBy).toEqual({ max: 3 })
	})

	it('is atomic: a double trigger cannot double-fire (the legacy bug)', () => {
		const { fatigue } = setup()
		const rules = [{ max: 1, window: '7d' as const }]
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)
		expect(fatigue.tryConsume('k', rules).allowed).toBe(false)
	})
})

describe('persistence and isolation', () => {
	it('shares state through the storage adapter', () => {
		const storage = memoryAdapter()
		const clock = new FakeClock()
		const a = createFatigue({ storage, clock })
		const b = createFatigue({ storage, clock })
		const rules = [{ max: 1, window: '1h' as const }]

		expect(a.tryConsume('k', rules).allowed).toBe(true)
		expect(b.tryConsume('k', rules).allowed).toBe(false)
	})

	it('namespaces keys so parallel instances do not collide', () => {
		const storage = memoryAdapter()
		const clock = new FakeClock()
		const a = createFatigue({ storage, clock, namespace: 'a' })
		const b = createFatigue({ storage, clock, namespace: 'b' })
		const rules = [{ max: 1, window: '1h' as const }]

		a.tryConsume('k', rules)
		b.tryConsume('k', rules)
		expect(Object.keys(storage.dump()).sort()).toEqual(['a:k', 'b:k'])
		expect(a.exportRecord('k')?.lifetime).toBe(1)
		expect(b.exportRecord('k')?.lifetime).toBe(1)
	})
})

describe('storage hygiene', () => {
	it('peek never writes, denied consumption never writes', () => {
		const { storage, fatigue } = setup()
		fatigue.peek('k', [{ max: 1 }])
		fatigue.tryConsume('k', [{ max: 1 }])
		const afterAllow = Object.keys(storage.dump()).length
		expect(afterAllow).toBe(1)
		expect(fatigue.tryConsume('k', [{ max: 1 }]).allowed).toBe(false)
		expect(Object.keys(storage.dump()).length).toBe(afterAllow)
	})

	it('survives corrupted and future-version records', () => {
		const { storage, fatigue } = setup()
		storage.set('fatigue-kit:k', '{oops')
		expect(fatigue.tryConsume('k', [{ max: 1 }]).allowed).toBe(true)

		storage.set('fatigue-kit:k', '{"v":99,"hits":[1],"lifetime":1}')
		expect(fatigue.peek('k', [{ max: 1 }]).allowed).toBe(true)
	})

	it('prunes old hits and caps the record size, while lifetime survives', () => {
		const { clock, fatigue } = setup({ maxHits: 3 })
		const rules = [{ max: 100, window: '10d' as const }]
		for (let i = 0; i < 5; i++) {
			fatigue.tryConsume('k', rules)
			clock.advance(HOUR)
		}
		const record = fatigue.exportRecord('k')
		expect(record?.hits).toHaveLength(3)
		expect(record?.lifetime).toBe(5)
	})

	it('resets one key or everything', () => {
		const { fatigue } = setup()
		const rules = [{ max: 1, window: '1h' as const }]
		fatigue.tryConsume('a', rules)
		fatigue.tryConsume('b', rules)

		fatigue.reset('a')
		expect(fatigue.exportRecord('a')).toBeNull()
		expect(fatigue.exportRecord('b')).not.toBeNull()

		fatigue.reset()
		expect(fatigue.exportRecord('b')).toBeNull()
	})

	it('reset() without a key requires storage.keys', () => {
		const { fatigue } = setup({
			storage: { get: () => null, set: () => undefined, remove: () => undefined },
		})
		expect(() => fatigue.reset()).toThrow(/keys\(\)/)
	})
})

describe('import / export', () => {
	it('seeds and reads records for migrations', () => {
		const { fatigue } = setup()
		fatigue.importRecord('k', { hits: [10, 20], lifetime: 7 })
		expect(fatigue.exportRecord('k')).toEqual({ v: 1, hits: [10, 20], lifetime: 7 })

		// Imported history is honoured by the rules.
		const clock = new FakeClock(1000)
		const other = createFatigue({ clock, storage: memoryAdapter() })
		other.importRecord('k', { hits: [10, 20], lifetime: 7 })
		expect(other.peek('k', [{ max: 1, window: '1h' }]).allowed).toBe(false)
	})

	it('filters invalid hits and defaults lifetime to hits.length', () => {
		const { fatigue } = setup()
		fatigue.importRecord('k', { hits: [Number.NaN, 5, 'x' as unknown as number] })
		expect(fatigue.exportRecord('k')).toEqual({ v: 1, hits: [5], lifetime: 1 })
	})
})

describe('input validation', () => {
	it('rejects invalid rules and keys', () => {
		const { fatigue } = setup()
		expect(() => fatigue.tryConsume('k', [])).toThrow(TypeError)
		expect(() => fatigue.tryConsume('k', {} as never)).toThrow(TypeError)
		expect(() => fatigue.tryConsume('k', [{ max: 0 }])).toThrow(TypeError)
		expect(() => fatigue.tryConsume('k', [{ max: 1, every: 'decade' } as never])).toThrow(TypeError)
		expect(() => fatigue.tryConsume('k', [{ max: 1, window: 'nope' }])).toThrow(TypeError)
		expect(() => fatigue.tryConsume('', [{ max: 1 }])).toThrow(TypeError)
	})
})
