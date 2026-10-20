import { describe, expect, it } from 'vitest'
import { decodeRecord, emptyRecord, encodeRecord, pruneRecord, RECORD_VERSION } from '../src/record'

describe('decodeRecord', () => {
	it('returns an empty record for missing values', () => {
		expect(decodeRecord(null)).toEqual(emptyRecord())
		expect(decodeRecord(undefined)).toEqual(emptyRecord())
		expect(decodeRecord('')).toEqual(emptyRecord())
	})

	it('returns an empty record for corrupted JSON', () => {
		expect(decodeRecord('{not json')).toEqual(emptyRecord())
		expect(decodeRecord('123')).toEqual(emptyRecord())
		expect(decodeRecord('"string"')).toEqual(emptyRecord())
	})

	it('returns an empty record for unknown or future versions', () => {
		expect(decodeRecord('{"v":99,"hits":[1],"lifetime":1}')).toEqual(emptyRecord())
		expect(decodeRecord('{"hits":[1]}')).toEqual(emptyRecord())
	})

	it('decodes valid records and normalizes them', () => {
		const decoded = decodeRecord('{"v":1,"hits":[30,10,20],"lifetime":7}')
		expect(decoded.v).toBe(RECORD_VERSION)
		expect(decoded.hits).toEqual([10, 20, 30])
		expect(decoded.lifetime).toBe(7)
	})

	it('filters non-numeric hits and falls back to hits.length for lifetime', () => {
		const decoded = decodeRecord('{"v":1,"hits":[10,"x",null,20]}')
		expect(decoded.hits).toEqual([10, 20])
		expect(decoded.lifetime).toBe(2)
	})
})

describe('encodeRecord / decodeRecord roundtrip', () => {
	it('roundtrips', () => {
		const record = { v: RECORD_VERSION, hits: [1, 2, 3], lifetime: 9 }
		expect(decodeRecord(encodeRecord(record))).toEqual(record)
	})
})

describe('pruneRecord', () => {
	it('drops hits older than keepFrom', () => {
		const record = { v: 1, hits: [1, 2, 3, 10], lifetime: 4 }
		pruneRecord(record, 3, 100)
		expect(record.hits).toEqual([3, 10])
	})

	it('caps the list at maxHits, keeping the newest', () => {
		const record = { v: 1, hits: [1, 2, 3, 4, 5], lifetime: 5 }
		pruneRecord(record, 0, 3)
		expect(record.hits).toEqual([3, 4, 5])
	})

	it('keeps boundary hits and never drops the newest when keepFrom reaches it', () => {
		const record = { v: 1, hits: [1, 2], lifetime: 2 }
		pruneRecord(record, 2, 10)
		expect(record.hits).toEqual([2])
	})
})
