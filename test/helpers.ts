import type { Clock } from '../src/types'

/** Deterministic clock for tests; start it at any epoch millisecond. */
export class FakeClock implements Clock {
	private current: number

	constructor(start = 0) {
		this.current = start
	}

	now(): number {
		return this.current
	}

	advance(ms: number): void {
		this.current += ms
	}

	setTo(timestamp: number): void {
		this.current = timestamp
	}
}

/** Local-time timestamp helper (arguments match `new Date(y, m, d, h, min)`). */
export function at(year: number, monthIndex: number, day: number, hours = 0, minutes = 0): number {
	return new Date(year, monthIndex, day, hours, minutes).getTime()
}
