/** Injectable clock so tests can freeze or accelerate time. */
export interface Clock {
	now(): number
}

/**
 * Duration: a millisecond number, or a string like `'45s'`, `'30m'`, `'12h'`, `'7d'`.
 */
export type Duration = number | string

/** At most `max` occurrences within a sliding window. */
export interface SlidingWindowRule {
	max: number
	window: Duration
}

/** At most `max` occurrences per calendar period, evaluated in device local time. */
export interface CalendarRule {
	max: number
	every: 'day' | 'week' | 'month' | 'year'
	/** Period boundary offset in local time, `'HH:mm'`. Default `'00:00'`. */
	cutoff?: string
	/** First weekday: `0` = Sunday … `6` = Saturday. Default `1` (Monday). */
	weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

/** Two occurrences must be at least `cooldown` apart. */
export interface CooldownRule {
	cooldown: Duration
}

/** At most `max` occurrences, ever. */
export interface LifetimeRule {
	max: number
}

export type FatigueRule = SlidingWindowRule | CalendarRule | CooldownRule | LifetimeRule

export interface ConsumeResult {
	allowed: boolean
	/**
	 * How many more times the key may be consumed under the strictest count-based
	 * rule. `Infinity` when no count-based rule applies (e.g. a cooldown-only key).
	 */
	remaining: number
	/** Earliest timestamp (ms) at which the key may be consumed again. Absent while allowed. */
	nextAvailableAt?: number
	/** The first rule that caused the denial. */
	deniedBy?: FatigueRule
}

/**
 * A synchronous string key-value store. Every built-in adapter implements this,
 * and so can yours — this is the only contract `createFatigue` relies on.
 */
export interface SyncStorage {
	get(key: string): string | null | undefined
	set(key: string, value: string): void
	remove(key: string): void
	/**
	 * Optional: list all keys known to this storage.
	 * Enables `fatigue.reset()` without a key.
	 */
	keys?(): string[]
}

/** Serialized fatigue record. `hits` are ascending timestamps in ms. */
export interface FatigueRecord {
	/** Record format version. */
	v: number
	hits: number[]
	/** Total consumption count, ever. Survives pruning. */
	lifetime: number
}

export interface FatigueOptions {
	/** Backing storage. Defaults to an in-memory store. */
	storage?: SyncStorage
	/** Clock. Defaults to the real system time. */
	clock?: Clock
	/** Prefix for storage keys. Default `'fatigue-kit'`. */
	namespace?: string
	/** Maximum hits kept per record; older ones are pruned on write. Default `100`. */
	maxHits?: number
}

export interface Fatigue {
	/** Atomically check the rules and, when allowed, consume one occurrence. */
	tryConsume(key: string, rules: FatigueRule | FatigueRule[]): ConsumeResult
	/** Check the rules without consuming. */
	peek(key: string, rules: FatigueRule | FatigueRule[]): ConsumeResult
	/** Drop one key, or every key when omitted (requires `storage.keys`). */
	reset(key?: string): void
	/** Read the raw record of a key. `null` when absent. */
	exportRecord(key: string): FatigueRecord | null
	/** Overwrite the record of a key (used for migrations and debugging). */
	importRecord(key: string, record: Partial<FatigueRecord>): void
}
