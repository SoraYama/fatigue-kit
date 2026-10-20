import type { FatigueRecord } from './types'

export const RECORD_VERSION = 1

export function emptyRecord(): FatigueRecord {
	return { v: RECORD_VERSION, hits: [], lifetime: 0 }
}

/**
 * Decode a raw storage value. Never throws: corrupted data or an unknown /
 * future record version decodes to an empty record (fresh start).
 */
export function decodeRecord(raw: string | null | undefined): FatigueRecord {
	if (!raw) return emptyRecord()
	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch {
		return emptyRecord()
	}
	if (parsed === null || typeof parsed !== 'object') return emptyRecord()
	const candidate = parsed as Partial<FatigueRecord>
	if (candidate.v !== RECORD_VERSION) return emptyRecord()
	const hits = Array.isArray(candidate.hits)
		? candidate.hits.filter((hit): hit is number => typeof hit === 'number' && Number.isFinite(hit))
		: []
	hits.sort((a, b) => a - b)
	const lifetime =
		typeof candidate.lifetime === 'number' &&
		Number.isFinite(candidate.lifetime) &&
		candidate.lifetime >= 0
			? candidate.lifetime
			: hits.length
	return { v: RECORD_VERSION, hits, lifetime }
}

export function encodeRecord(record: FatigueRecord): string {
	return JSON.stringify(record)
}

/**
 * Drop hits older than `keepFrom` (exclusive), then cap the array at the
 * `maxHits` newest entries. The newest hit is never dropped, so cooldown rules
 * keep working after pruning.
 */
export function pruneRecord(record: FatigueRecord, keepFrom: number, maxHits: number): void {
	let first = 0
	while (first < record.hits.length) {
		const hit = record.hits[first]
		if (hit === undefined || hit >= keepFrom) break
		first++
	}
	if (first > 0) record.hits.splice(0, first)
	if (record.hits.length > maxHits) record.hits.splice(0, record.hits.length - maxHits)
}
