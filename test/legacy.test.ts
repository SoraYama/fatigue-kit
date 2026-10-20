import { describe, expect, it } from 'vitest'
import { memoryAdapter } from '../src/adapters/memory'
import { createFatigue } from '../src/engine'
import { DAY_MS, migrateLegacyRecord } from '../src/legacy'
import { FakeClock } from './helpers'

describe('migrateLegacyRecord', () => {
	it('converts the legacy object shape', () => {
		const migrated = migrateLegacyRecord({
			times: 3,
			date: '2026/10/20',
			duration: 7,
			todayCount: 1,
		})
		expect(migrated).not.toBeNull()
		expect(migrated?.record.hits).toEqual([new Date(2026, 9, 20).getTime()])
		expect(migrated?.record.lifetime).toBe(3)
		expect(migrated?.cooldownMs).toBe(7 * DAY_MS)
	})

	it('accepts the raw stored string', () => {
		const migrated = migrateLegacyRecord('{"times":2,"date":"2026-10-20","duration":1}')
		expect(migrated?.record.hits).toEqual([new Date(2026, 9, 20).getTime()])
		expect(migrated?.record.lifetime).toBe(2)
		expect(migrated?.cooldownMs).toBe(DAY_MS)
	})

	it('treats a missing duration as "no cooldown"', () => {
		const migrated = migrateLegacyRecord({ times: 1, date: '2026/10/20' })
		expect(migrated?.cooldownMs).toBeNull()
	})

	it('returns null for unusable input', () => {
		expect(migrateLegacyRecord(null)).toBeNull()
		expect(migrateLegacyRecord(undefined)).toBeNull()
		expect(migrateLegacyRecord('{broken json')).toBeNull()
		expect(migrateLegacyRecord({ times: 3 })).toBeNull()
		expect(migrateLegacyRecord({ date: 'not a date' })).toBeNull()
	})
})

describe('legacy integration', () => {
	it('imported legacy history keeps old fatigue active', () => {
		const clock = new FakeClock(new Date(2026, 9, 22, 10, 0).getTime())
		const fatigue = createFatigue({ clock, storage: memoryAdapter() })

		const migrated = migrateLegacyRecord({ times: 3, date: '2026/10/20', duration: 7 })
		if (migrated === null) throw new Error('migration unexpectedly failed')
		fatigue.importRecord('popup', migrated.record)

		// Old behaviour: 3 total hits already consumed a max-3 budget.
		expect(fatigue.peek('popup', [{ max: 3 }]).allowed).toBe(false)

		// Old behaviour: still inside the 7-day cooldown.
		const cooldownRules = [{ cooldown: migrated.cooldownMs ?? 0 }]
		const lastHit = new Date(2026, 9, 20).getTime()
		clock.setTo(lastHit + DAY_MS)
		const denied = fatigue.peek('popup', cooldownRules)
		expect(denied.allowed).toBe(false)
		expect(denied.nextAvailableAt).toBe(lastHit + 7 * DAY_MS)

		clock.setTo(lastHit + 7 * DAY_MS)
		expect(fatigue.peek('popup', cooldownRules).allowed).toBe(true)
	})
})
