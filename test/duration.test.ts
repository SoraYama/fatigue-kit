import { describe, expect, it } from 'vitest'
import { parseDuration } from '../src/duration'

describe('parseDuration', () => {
	it('passes milliseconds through', () => {
		expect(parseDuration(1500)).toBe(1500)
	})

	it('parses unit strings', () => {
		expect(parseDuration('45s')).toBe(45_000)
		expect(parseDuration('30m')).toBe(1_800_000)
		expect(parseDuration('12h')).toBe(43_200_000)
		expect(parseDuration('7d')).toBe(604_800_000)
	})

	it('tolerates surrounding whitespace', () => {
		expect(parseDuration(' 7d ')).toBe(604_800_000)
	})

	it('rejects invalid input', () => {
		expect(() => parseDuration(0)).toThrow(TypeError)
		expect(() => parseDuration(-5)).toThrow(TypeError)
		expect(() => parseDuration(Number.NaN)).toThrow(TypeError)
		expect(() => parseDuration(Number.POSITIVE_INFINITY)).toThrow(TypeError)
		expect(() => parseDuration('7')).toThrow(TypeError)
		expect(() => parseDuration('7x')).toThrow(TypeError)
		expect(() => parseDuration('')).toThrow(TypeError)
	})
})
