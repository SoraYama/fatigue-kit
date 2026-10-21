export type CalendarEvery = 'day' | 'week' | 'month' | 'year'

export interface CalendarSpec {
	every: CalendarEvery
	cutoffMinutes: number
	weekStartsOn: number
}

/** Parse a `'HH:mm'` cutoff into minutes after local midnight. Default (no cutoff) is `0`. */
export function parseCutoff(cutoff: string | undefined): number {
	if (cutoff === undefined) return 0
	const match = /^(\d{1,2}):(\d{2})$/.exec(cutoff.trim())
	if (match === null || match[1] === undefined || match[2] === undefined) {
		throw new TypeError(`[fatigue-kit] invalid cutoff: "${cutoff}". Expected 'HH:mm'.`)
	}
	const hours = Number(match[1])
	const minutes = Number(match[2])
	if (hours > 23 || minutes > 59) {
		throw new TypeError(
			`[fatigue-kit] invalid cutoff: "${cutoff}". Hours must be 0-23, minutes 0-59.`,
		)
	}
	return hours * 60 + minutes
}

function localMidnight(ts: number): Date {
	const date = new Date(ts)
	date.setHours(0, 0, 0, 0)
	return date
}

/** Midnight-based start of the period containing `ts`, before applying the cutoff. */
function naturalPeriodStart(ts: number, spec: CalendarSpec): number {
	switch (spec.every) {
		case 'day':
			return localMidnight(ts).getTime()
		case 'week': {
			const date = localMidnight(ts)
			const offset = (date.getDay() - spec.weekStartsOn + 7) % 7
			date.setDate(date.getDate() - offset)
			return date.getTime()
		}
		case 'month': {
			const date = new Date(ts)
			return new Date(date.getFullYear(), date.getMonth(), 1).getTime()
		}
		case 'year': {
			const date = new Date(ts)
			return new Date(date.getFullYear(), 0, 1).getTime()
		}
	}
}

function previousNaturalStart(naturalStart: number, spec: CalendarSpec): number {
	switch (spec.every) {
		case 'day': {
			const date = new Date(naturalStart)
			date.setDate(date.getDate() - 1)
			return date.getTime()
		}
		case 'week': {
			const date = new Date(naturalStart)
			date.setDate(date.getDate() - 7)
			return date.getTime()
		}
		case 'month': {
			const date = new Date(naturalStart)
			return new Date(date.getFullYear(), date.getMonth() - 1, 1).getTime()
		}
		case 'year': {
			const date = new Date(naturalStart)
			return new Date(date.getFullYear() - 1, 0, 1).getTime()
		}
	}
}

/**
 * Local wall-clock time of `cutoffMinutes` past midnight, built from date
 * components. On DST transition days "midnight epoch + fixed minutes" would
 * land an hour off wall-clock time (e.g. after spring-forward a 04:00 cutoff
 * computed by addition would actually fire at 05:00), so the boundary must be
 * constructed, never added.
 */
function wallClockBoundary(midnight: number, cutoffMinutes: number): number {
	const date = new Date(midnight)
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		Math.floor(cutoffMinutes / 60),
		cutoffMinutes % 60,
	).getTime()
}

/**
 * Start of the calendar period containing `ts`, cutoff applied.
 * All arithmetic works on local date components (never `+ 24h`), so DST
 * transitions cannot shift a boundary.
 */
export function calendarPeriodStart(ts: number, spec: CalendarSpec): number {
	const natural = naturalPeriodStart(ts, spec)
	const boundary = wallClockBoundary(natural, spec.cutoffMinutes)
	if (boundary <= ts) return boundary
	return wallClockBoundary(previousNaturalStart(natural, spec), spec.cutoffMinutes)
}

// Per-step cursors used to find the *next* boundary. Each jump is guaranteed to
// be shorter than one period (so no period can be skipped) and long enough to
// make progress; the loop simply walks forward until the boundary passes `ts`.
const JUMP_MS: Record<CalendarEvery, number> = {
	day: 12 * 3_600_000,
	week: 8 * 86_400_000,
	month: 8 * 86_400_000,
	year: 32 * 86_400_000,
}

/** Start of the calendar period following the one containing `ts`. Strictly greater than `ts`. */
export function calendarNextPeriodStart(ts: number, spec: CalendarSpec): number {
	const jump = JUMP_MS[spec.every]
	let cursor = ts
	for (let i = 0; i < 50; i++) {
		cursor += jump
		const start = calendarPeriodStart(cursor, spec)
		if (start > ts) return start
	}
	throw new Error('[fatigue-kit] failed to compute the next calendar period')
}
