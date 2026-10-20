import type { Duration } from './types'

const UNITS: Record<string, number> = {
	s: 1_000,
	m: 60_000,
	h: 3_600_000,
	d: 86_400_000,
}

/** Parse a {@link Duration} into milliseconds. Throws `TypeError` on invalid input. */
export function parseDuration(duration: Duration): number {
	if (typeof duration === 'number') {
		if (!Number.isFinite(duration) || duration <= 0) {
			throw new TypeError(`[fatigue-kit] invalid duration: ${duration}`)
		}
		return duration
	}
	const match = /^(\d+(?:\.\d+)?)\s*([smhd])$/.exec(duration.trim())
	if (match === null || match[1] === undefined || match[2] === undefined) {
		throw new TypeError(
			`[fatigue-kit] invalid duration: "${duration}". Expected a positive number of ms, or '45s' / '30m' / '12h' / '7d'.`,
		)
	}
	const unitMs = UNITS[match[2]]
	if (unitMs === undefined) {
		throw new TypeError(`[fatigue-kit] invalid duration: "${duration}"`)
	}
	const ms = Number(match[1]) * unitMs
	if (!(ms > 0)) {
		throw new TypeError(`[fatigue-kit] invalid duration: "${duration}"`)
	}
	return ms
}
