import type { SyncStorage } from '../types'

/**
 * Minimal interface shared by `@react-native-async-storage/async-storage` and
 * most RN-compatible storage libraries. Pass your storage instance directly.
 */
export interface AsyncStorageLike {
	getItem(key: string): Promise<string | null>
	setItem(key: string, value: string): Promise<void>
	removeItem(key: string): Promise<void>
}

export interface AsyncStorageAdapter {
	/** Synchronous view over the async backend. Only use it once `ready` resolved. */
	storage: SyncStorage
	/** Resolves once the in-memory cache has been hydrated from the backend. */
	ready: Promise<void>
	/** Persist pending writes now. Also runs automatically, debounced. */
	flush(): Promise<void>
}

export interface AsyncStorageAdapterOptions {
	/** Must match the `namespace` of the fatigue instance. Default `'fatigue-kit'`. */
	namespace?: string
	/** Debounce window for background flushes, ms. Default `50`. */
	flushDelay?: number
	onError?: (error: unknown) => void
}

const DEFAULT_NAMESPACE = 'fatigue-kit'
const DEFAULT_FLUSH_DELAY = 50

/**
 * React Native (and any async backend) adapter.
 *
 * The core engine is synchronous for atomicity, so this adapter hydrates all
 * known keys once up front (`ready`), serves reads from memory, and writes back
 * in debounced batches. An index key keeps track of which keys belong to
 * fatigue-kit. Call `flush()` from an `AppState` "background" listener so the
 * last writes survive an app kill.
 *
 * ```ts
 * import AsyncStorage from '@react-native-async-storage/async-storage'
 * const handle = asyncStorageAdapter(AsyncStorage)
 * await handle.ready
 * const fatigue = createFatigue({ storage: handle.storage })
 * AppState.addEventListener('change', (state) => {
 *   if (state === 'background') handle.flush()
 * })
 * ```
 */
export function asyncStorageAdapter(
	client: AsyncStorageLike,
	options: AsyncStorageAdapterOptions = {},
): AsyncStorageAdapter {
	const namespace = options.namespace ?? DEFAULT_NAMESPACE
	const flushDelay = options.flushDelay ?? DEFAULT_FLUSH_DELAY
	const onError =
		options.onError ??
		((error: unknown) => {
			console.warn('[fatigue-kit] async storage operation failed:', error)
		})
	const indexKey = `${namespace}:__index__`
	const cache = new Map<string, string | null>()
	const pending = new Map<string, string | null>()
	const index = new Set<string>()
	let indexDirty = false
	let timer: ReturnType<typeof setTimeout> | null = null

	const safe = async <T>(operation: () => Promise<T>): Promise<T | null> => {
		try {
			return await operation()
		} catch (error) {
			onError(error)
			return null
		}
	}

	const ready = (async () => {
		const rawIndex = await safe(() => client.getItem(indexKey))
		if (rawIndex !== null) {
			try {
				for (const key of JSON.parse(rawIndex) as string[]) index.add(key)
			} catch {
				// Corrupt index: start empty; keys re-register on their next write.
			}
		}
		await Promise.all(
			[...index].map(async (key) => {
				cache.set(key, await safe(() => client.getItem(key)))
			}),
		)
	})()

	async function flush(): Promise<void> {
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}
		const writes = [...pending]
		pending.clear()
		await Promise.all(
			writes.map(([key, value]) =>
				value === null
					? safe(() => client.removeItem(key))
					: safe(() => client.setItem(key, value)),
			),
		)
		if (indexDirty) {
			indexDirty = false
			await safe(() => client.setItem(indexKey, JSON.stringify([...index])))
		}
	}

	function schedule(): void {
		if (timer !== null) return
		timer = setTimeout(() => {
			timer = null
			void flush()
		}, flushDelay)
	}

	const storage: SyncStorage = {
		get: (key) => cache.get(key) ?? null,
		set: (key, value) => {
			cache.set(key, value)
			pending.set(key, value)
			if (!index.has(key)) {
				index.add(key)
				indexDirty = true
			}
			schedule()
		},
		remove: (key) => {
			cache.delete(key)
			pending.set(key, null)
			if (index.has(key)) {
				index.delete(key)
				indexDirty = true
			}
			schedule()
		},
		keys: () => [...index],
	}

	return { storage, ready, flush }
}
