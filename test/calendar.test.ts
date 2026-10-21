import { describe, expect, it } from 'vitest'
import { calendarNextPeriodStart, calendarPeriodStart, parseCutoff } from '../src/calendar'
import { at } from './helpers'

describe('parseCutoff', () => {
	it('defaults to 0', () => {
		expect(parseCutoff(undefined)).toBe(0)
	})

	it('parses HH:mm', () => {
		expect(parseCutoff('04:00')).toBe(240)
		expect(parseCutoff('4:05')).toBe(245)
		expect(parseCutoff('23:59')).toBe(1439)
	})

	it('rejects invalid values', () => {
		expect(() => parseCutoff('25:00')).toThrow(TypeError)
		expect(() => parseCutoff('12:60')).toThrow(TypeError)
		expect(() => parseCutoff('4:5')).toThrow(TypeError)
		expect(() => parseCutoff('abc')).toThrow(TypeError)
	})
})

describe('calendarPeriodStart', () => {
	it('computes local day boundaries', () => {
		const spec = { every: 'day' as const, cutoffMinutes: 0, weekStartsOn: 1 }
		expect(calendarPeriodStart(at(2026, 2, 8, 5, 30), spec)).toBe(at(2026, 2, 8))
		expect(calendarPeriodStart(at(2026, 2, 8), spec)).toBe(at(2026, 2, 8))
	})

	it('shifts days by the cutoff', () => {
		const spec = { every: 'day' as const, cutoffMinutes: parseCutoff('04:00'), weekStartsOn: 1 }
		// Before 04:00 the day still belongs to the previous business day.
		expect(calendarPeriodStart(at(2026, 2, 8, 3, 0), spec)).toBe(at(2026, 2, 7, 4, 0))
		// Exactly on the boundary the new period starts.
		expect(calendarPeriodStart(at(2026, 2, 8, 4, 0), spec)).toBe(at(2026, 2, 8, 4, 0))
		expect(calendarPeriodStart(at(2026, 2, 8, 23, 0), spec)).toBe(at(2026, 2, 8, 4, 0))
	})

	it('uses wall-clock boundaries on DST transition days (2026-03-08 springs forward in some zones)', () => {
		const spec = { every: 'day' as const, cutoffMinutes: parseCutoff('04:00'), weekStartsOn: 1 }
		const ts = at(2026, 2, 8, 4, 0)
		expect(calendarPeriodStart(ts, spec)).toBe(ts)
	})

	it('computes weeks with a configurable first day', () => {
		// 2026-10-14 is a Wednesday.
		const mondayFirst = { every: 'week' as const, cutoffMinutes: 0, weekStartsOn: 1 }
		expect(calendarPeriodStart(at(2026, 9, 14, 12, 0), mondayFirst)).toBe(at(2026, 9, 12))
		const sundayFirst = { every: 'week' as const, cutoffMinutes: 0, weekStartsOn: 0 }
		expect(calendarPeriodStart(at(2026, 9, 14, 12, 0), sundayFirst)).toBe(at(2026, 9, 11))
		// Jan 1st 2026 is a Thursday; Monday-first puts it in the Dec 29th week.
		expect(calendarPeriodStart(at(2026, 0, 1, 9, 0), mondayFirst)).toBe(at(2025, 11, 29))
	})

	it('computes month boundaries, including the Jan 31 edge', () => {
		const spec = { every: 'month' as const, cutoffMinutes: 0, weekStartsOn: 1 }
		expect(calendarPeriodStart(at(2026, 0, 31, 12, 0), spec)).toBe(at(2026, 0, 1))
		expect(calendarPeriodStart(at(2026, 11, 31, 12, 0), spec)).toBe(at(2026, 11, 1))
	})

	it('computes year boundaries', () => {
		const spec = { every: 'year' as const, cutoffMinutes: 0, weekStartsOn: 1 }
		expect(calendarPeriodStart(at(2026, 6, 4, 12, 0), spec)).toBe(at(2026, 0, 1))
	})
})

describe('calendarNextPeriodStart', () => {
	const specFor = (every: 'day' | 'week' | 'month' | 'year', cutoff = '00:00') => ({
		every,
		cutoffMinutes: parseCutoff(cutoff),
		weekStartsOn: 1,
	})

	it('returns the next day, never skipping one', () => {
		expect(calendarNextPeriodStart(at(2026, 9, 20, 12, 0), specFor('day'))).toBe(at(2026, 9, 21))
		expect(calendarNextPeriodStart(at(2026, 9, 20, 23, 59), specFor('day'))).toBe(at(2026, 9, 21))
	})

	it('respects the cutoff for day boundaries', () => {
		expect(calendarNextPeriodStart(at(2026, 9, 20, 3, 0), specFor('day', '04:00'))).toBe(
			at(2026, 9, 20, 4, 0),
		)
		expect(calendarNextPeriodStart(at(2026, 9, 20, 12, 0), specFor('day', '04:00'))).toBe(
			at(2026, 9, 21, 4, 0),
		)
	})

	it('returns the next Monday', () => {
		// 2026-10-14 is a Wednesday; the next week starts Monday the 19th.
		expect(calendarNextPeriodStart(at(2026, 9, 14, 12, 0), specFor('week'))).toBe(at(2026, 9, 19))
	})

	it('handles month edges (Jan 31)', () => {
		expect(calendarNextPeriodStart(at(2026, 0, 31, 12, 0), specFor('month'))).toBe(at(2026, 1, 1))
		expect(calendarNextPeriodStart(at(2026, 11, 15, 12, 0), specFor('month'))).toBe(at(2027, 0, 1))
	})

	it('handles year edges', () => {
		expect(calendarNextPeriodStart(at(2026, 6, 4, 12, 0), specFor('year'))).toBe(at(2027, 0, 1))
	})
})
