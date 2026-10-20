import type { SyncStorage } from '../types'

export interface WebStorageAdapterOptions {
	/** Underlying `Storage`. Defaults to the platform global, resolved lazily. */
	storage?: Storage
	/** Called when the underlying storage throws (quota, private mode, …). */
	onError?: (error: unknown) => void
}

export function defaultOnError(error: unknown): void {
	console.warn('[fatigue-kit] storage operation failed:', error)
}

/** Resolve a platform storage global lazily; `undefined` when absent (Node, SSR, …). */
export function globalStorage(name: 'localStorage' | 'sessionStorage'): Storage | undefined {
	try {
		const candidate = (globalThis as Record<string, unknown>)[name]
		return typeof candidate === 'object' && candidate !== null ? (candidate as Storage) : undefined
	} catch {
		return undefined
	}
}

/**
 * Shared implementation for the Web `Storage` family. Failures are reported via
 * `onError` instead of thrown: a broken quota must not crash the host page —
 * it only means fatigue state degrades to per-session.
 */
export function webStorageAdapter(
	resolve: () => Storage,
	onError: (error: unknown) => void = defaultOnError,
): SyncStorage {
	return {
		get(key) {
			try {
				return resolve().getItem(key)
			} catch (error) {
				onError(error)
				return null
			}
		},
		set(key, value) {
			try {
				resolve().setItem(key, value)
			} catch (error) {
				onError(error)
			}
		},
		remove(key) {
			try {
				resolve().removeItem(key)
			} catch (error) {
				onError(error)
			}
		},
		keys() {
			try {
				const storage = resolve()
				const keys: string[] = []
				for (let i = 0; i < storage.length; i++) {
					const key = storage.key(i)
					if (key !== null) keys.push(key)
				}
				return keys
			} catch (error) {
				onError(error)
				return []
			}
		},
	}
}
