import { emptyRecord } from './record'
import type { FatigueRecord } from './types'

/** Shape of the records written by the legacy internal FatigueManager. */
export interface LegacyFatigueRecord {
	times?: number
	/** `'YYYY/MM/DD'` (`'YYYY-MM-DD'` is tolerated too). */
	date?: string
	/** Cooldown length in days. */
	duration?: number
	todayCount?: number
}

export const DAY_MS = 86_400_000

export interface MigratedLegacyRecord {
	record: FatigueRecord
	/**
	 * Cooldown in ms implied by the legacy `duration` field, or `null`.
	 * Pass it as `{ cooldown: cooldownMs }` to keep the old behaviour.
	 */
	cooldownMs: number | null
}

/**
 * Convert a legacy record (raw string or parsed object) into the fatigue-kit
 * format. Returns `null` when no usable `date` field exists.
 *
 * Approximation: legacy records only remember the last activity *day* plus an
 * aggregate `todayCount`, so the migrated record holds a single hit placed at
 * local midnight of that day; `times` maps to `lifetime`.
 *
 * ```ts
 * const migrated = migrateLegacyRecord(await storage.getItem(legacyKey))
 * if (migrated) {
 *   fatigue.importRecord(key, migrated.record)
 *   const rules = [{ max: 3, window: '7d' }]
 *   if (migrated.cooldownMs !== null) rules.push({ cooldown: migrated.cooldownMs })
 * }
 * ```
 */
export function migrateLegacyRecord(
	input: string | LegacyFatigueRecord | null | undefined,
): MigratedLegacyRecord | null {
	if (input === null || input === undefined) return null
	let raw: unknown = input
	if (typeof input === 'string') {
		try {
			raw = JSON.parse(input)
		} catch {
			return null
		}
	}
	if (raw === null || typeof raw !== 'object') return null
	const candidate = raw as LegacyFatigueRecord
	const lastHit = parseLegacyDate(candidate.date)
	if (lastHit === null) return null
	const record = emptyRecord()
	record.hits = [lastHit]
	record.lifetime = Math.max(0, numberOr(candidate.times, 0))
	const durationDays = numberOr(candidate.duration, 0)
	return { record, cooldownMs: durationDays > 0 ? durationDays * DAY_MS : null }
}

function parseLegacyDate(value: unknown): number | null {
	if (typeof value !== 'string') return null
	const match = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(value.trim())
	if (match === null) {
		const parsed = Date.parse(value)
		return Number.isNaN(parsed) ? null : parsed
	}
	const [, year, month, day] = match
	if (year === undefined || month === undefined || day === undefined) return null
	return new Date(Number(year), Number(month) - 1, Number(day)).getTime()
}

function numberOr(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
