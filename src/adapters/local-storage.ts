import type { SyncStorage } from '../types'
import { globalStorage, type WebStorageAdapterOptions, webStorageAdapter } from './web'

function requireLocalStorage(): Storage {
	const storage = globalStorage('localStorage')
	if (storage === undefined) {
		throw new Error(
			'[fatigue-kit] localStorageAdapter: `localStorage` is not available in this environment. Pass `{ storage }` explicitly (tests, SSR, webviews).',
		)
	}
	return storage
}

/**
 * Web / H5 adapter backed by `localStorage`. Data survives reloads and browser
 * restarts, shared across all tabs of the origin.
 *
 * Throws at construction when `localStorage` is unavailable and no `storage`
 * option was given; failures during operation are reported via `onError`
 * instead of thrown.
 */
export function localStorageAdapter(options: WebStorageAdapterOptions = {}): SyncStorage {
	const storage = options.storage ?? requireLocalStorage()
	return webStorageAdapter(() => storage, options.onError)
}
