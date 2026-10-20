import { memoryAdapter } from './adapters/memory'
import {
	type CalendarSpec,
	calendarNextPeriodStart,
	calendarPeriodStart,
	parseCutoff,
} from './calendar'
import { parseDuration } from './duration'
import { decodeRecord, encodeRecord, pruneRecord, RECORD_VERSION } from './record'
import type {
	CalendarRule,
	Clock,
	ConsumeResult,
	CooldownRule,
	Fatigue,
	FatigueOptions,
	FatigueRecord,
	FatigueRule,
	LifetimeRule,
	SlidingWindowRule,
	SyncStorage,
} from './types'

const DEFAULT_NAMESPACE = 'fatigue-kit'
const DEFAULT_MAX_HITS = 100

// Rules are compiled once per call so duration strings are parsed a single time.
type CompiledRule =
	| { kind: 'sliding'; rule: SlidingWindowRule; max: number; windowMs: number }
	| { kind: 'calendar'; rule: CalendarRule; max: number; spec: CalendarSpec }
	| { kind: 'cooldown'; rule: CooldownRule; cooldownMs: number }
	| { kind: 'lifetime'; rule: LifetimeRule; max: number }

interface RuleOutcome {
	remaining: number
	nextAvailableAt?: number
}

function assertNonEmpty(value: string, label: string): void {
	if (typeof value !== 'string' || value.length === 0) {
		throw new TypeError(`[fatigue-kit] ${label} must be a non-empty string`)
	}
}

function requireMax(max: number): void {
	if (!Number.isInteger(max) || max < 1) {
		throw new TypeError(`[fatigue-kit] rule "max" must be a positive integer, got ${max}`)
	}
}

function compileRules(input: FatigueRule | FatigueRule[]): CompiledRule[] {
	const list = Array.isArray(input) ? input : [input]
	if (list.length === 0) {
		throw new TypeError('[fatigue-kit] at least one rule is required')
	}
	return list.map((rule): CompiledRule => {
		if (rule === null || typeof rule !== 'object') {
			throw new TypeError(`[fatigue-kit] unknown rule: ${JSON.stringify(rule)}`)
		}
		if ('window' in rule) {
			requireMax(rule.max)
			return { kind: 'sliding', rule, max: rule.max, windowMs: parseDuration(rule.window) }
		}
		if ('every' in rule) {
			requireMax(rule.max)
			if (
				rule.every !== 'day' &&
				rule.every !== 'week' &&
				rule.every !== 'month' &&
				rule.every !== 'year'
			) {
				throw new TypeError(`[fatigue-kit] invalid "every": ${JSON.stringify(rule.every)}`)
			}
			return {
				kind: 'calendar',
				rule,
				max: rule.max,
				spec: {
					every: rule.every,
					cutoffMinutes: parseCutoff(rule.cutoff),
					weekStartsOn: rule.weekStartsOn ?? 1,
				},
			}
		}
		if ('cooldown' in rule) {
			return { kind: 'cooldown', rule, cooldownMs: parseDuration(rule.cooldown) }
		}
		if ('max' in rule) {
			requireMax(rule.max)
			return { kind: 'lifetime', rule, max: rule.max }
		}
		throw new TypeError(`[fatigue-kit] unknown rule: ${JSON.stringify(rule)}`)
	})
}

function outcomeFor(compiled: CompiledRule, record: FatigueRecord, now: number): RuleOutcome {
	switch (compiled.kind) {
		case 'sliding': {
			const from = now - compiled.windowMs
			let count = 0
			let oldest = Number.POSITIVE_INFINITY
			for (const hit of record.hits) {
				if (hit > from) {
					count++
					if (hit < oldest) oldest = hit
				}
			}
			const remaining = compiled.max - count
			return {
				remaining,
				nextAvailableAt:
					remaining <= 0 && oldest !== Number.POSITIVE_INFINITY
						? oldest + compiled.windowMs
						: undefined,
			}
		}
		case 'calendar': {
			const start = calendarPeriodStart(now, compiled.spec)
			let count = 0
			for (const hit of record.hits) {
				if (hit >= start) count++
			}
			const remaining = compiled.max - count
			return {
				remaining,
				nextAvailableAt: remaining <= 0 ? calendarNextPeriodStart(now, compiled.spec) : undefined,
			}
		}
		case 'cooldown': {
			const lastHit = record.hits.length > 0 ? record.hits[record.hits.length - 1] : undefined
			if (lastHit === undefined) return { remaining: Number.POSITIVE_INFINITY }
			const readyAt = lastHit + compiled.cooldownMs
			return {
				remaining: Number.POSITIVE_INFINITY,
				nextAvailableAt: readyAt > now ? readyAt : undefined,
			}
		}
		case 'lifetime': {
			return { remaining: compiled.max - record.lifetime }
		}
	}
}

function evaluate(record: FatigueRecord, compiled: CompiledRule[], now: number): ConsumeResult {
	let remaining = Number.POSITIVE_INFINITY
	let nextAvailableAt: number | undefined
	let deniedBy: FatigueRule | undefined
	for (const rule of compiled) {
		const outcome = outcomeFor(rule, record, now)
		if (Number.isFinite(outcome.remaining)) {
			remaining = Math.min(remaining, outcome.remaining)
		}
		if (
			outcome.nextAvailableAt !== undefined &&
			(nextAvailableAt === undefined || outcome.nextAvailableAt > nextAvailableAt)
		) {
			nextAvailableAt = outcome.nextAvailableAt
		}
		const ruleAllows =
			outcome.remaining > 0 &&
			(outcome.nextAvailableAt === undefined || outcome.nextAvailableAt <= now)
		if (!ruleAllows) deniedBy ??= rule.rule
	}
	const result: ConsumeResult = {
		allowed: deniedBy === undefined,
		remaining: Math.max(0, remaining),
	}
	if (nextAvailableAt !== undefined) result.nextAvailableAt = nextAvailableAt
	if (deniedBy !== undefined) result.deniedBy = deniedBy
	return result
}

/**
 * Oldest timestamp that still has to be kept to evaluate the rules. Used to
 * prune the hit list on write: anything older than this is dead weight, and the
 * `lifetime` counter keeps lifetime rules working regardless.
 */
function keepFrom(compiled: CompiledRule[], now: number): number {
	let keep = now
	for (const rule of compiled) {
		if (rule.kind === 'sliding') keep = Math.min(keep, now - rule.windowMs)
		else if (rule.kind === 'calendar') keep = Math.min(keep, calendarPeriodStart(now, rule.spec))
		else if (rule.kind === 'cooldown') keep = Math.min(keep, now - rule.cooldownMs)
	}
	return keep
}

/**
 * Create a fatigue (frequency capping) instance.
 *
 * ```ts
 * const fatigue = createFatigue({ storage: localStorageAdapter() })
 * const { allowed } = fatigue.tryConsume('popup', [{ max: 1, every: 'day' }])
 * ```
 */
export function createFatigue(options: FatigueOptions = {}): Fatigue {
	const storage: SyncStorage = options.storage ?? memoryAdapter()
	const clock: Clock = options.clock ?? { now: () => Date.now() }
	const namespace = options.namespace ?? DEFAULT_NAMESPACE
	const maxHits = options.maxHits ?? DEFAULT_MAX_HITS
	assertNonEmpty(namespace, 'namespace')
	if (!Number.isInteger(maxHits) || maxHits < 1) {
		throw new TypeError(`[fatigue-kit] maxHits must be a positive integer, got ${maxHits}`)
	}

	const storageKey = (key: string): string => {
		assertNonEmpty(key, 'key')
		return `${namespace}:${key}`
	}

	const read = (key: string): FatigueRecord => decodeRecord(storage.get(storageKey(key)))

	const tryConsume = (key: string, rules: FatigueRule | FatigueRule[]): ConsumeResult => {
		const compiled = compileRules(rules)
		const now = clock.now()
		const record = read(key)
		const result = evaluate(record, compiled, now)
		if (result.allowed) {
			// `remaining` describes the state *after* the call, so `remaining === 0`
			// means "this was the last allowed consumption".
			if (Number.isFinite(result.remaining)) {
				result.remaining = Math.max(0, result.remaining - 1)
			}
			record.hits.push(now)
			record.lifetime += 1
			pruneRecord(record, keepFrom(compiled, now), maxHits)
			storage.set(storageKey(key), encodeRecord(record))
		}
		return result
	}

	const peek = (key: string, rules: FatigueRule | FatigueRule[]): ConsumeResult => {
		const compiled = compileRules(rules)
		return evaluate(read(key), compiled, clock.now())
	}

	const reset = (key?: string): void => {
		if (key !== undefined) {
			storage.remove(storageKey(key))
			return
		}
		if (typeof storage.keys !== 'function') {
			throw new Error(
				'[fatigue-kit] reset() without a key requires a storage adapter implementing keys()',
			)
		}
		const prefix = `${namespace}:`
		for (const storedKey of storage.keys()) {
			if (storedKey.startsWith(prefix)) storage.remove(storedKey)
		}
	}

	const exportRecord = (key: string): FatigueRecord | null => {
		const raw = storage.get(storageKey(key))
		return raw ? decodeRecord(raw) : null
	}

	const importRecord = (key: string, record: Partial<FatigueRecord>): void => {
		const hits = (record.hits ?? [])
			.filter((hit): hit is number => typeof hit === 'number' && Number.isFinite(hit))
			.sort((a, b) => a - b)
		const lifetime =
			typeof record.lifetime === 'number' &&
			Number.isFinite(record.lifetime) &&
			record.lifetime >= 0
				? record.lifetime
				: hits.length
		storage.set(storageKey(key), encodeRecord({ v: RECORD_VERSION, hits, lifetime }))
	}

	return { tryConsume, peek, reset, exportRecord, importRecord }
}
