import type { SyncStorage } from '../types'

export interface MemoryAdapter extends SyncStorage {
	/** Snapshot of the underlying map. Handy for tests and debugging. */
	dump(): Record<string, string>
}

/**
 * In-memory adapter. This is the default storage of `createFatigue` and the
 * right choice for unit tests, SSR and stateless Node.js scripts.
 * Data lives exactly as long as the fatigue instance (or the process) does.
 */
export function memoryAdapter(initial?: Record<string, string>): MemoryAdapter {
	const map = new Map(Object.entries(initial ?? {}))
	return {
		get: (key) => map.get(key) ?? null,
		set: (key, value) => {
			map.set(key, value)
		},
		remove: (key) => {
			map.delete(key)
		},
		keys: () => [...map.keys()],
		dump: () => Object.fromEntries(map),
	}
}
