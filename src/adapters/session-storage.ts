import type { SyncStorage } from '../types'
import { globalStorage, type WebStorageAdapterOptions, webStorageAdapter } from './web'

export type { WebStorageAdapterOptions } from './web'

function requireSessionStorage(): Storage {
	const storage = globalStorage('sessionStorage')
	if (storage === undefined) {
		throw new Error(
			'[fatigue-kit] sessionStorageAdapter: `sessionStorage` is not available in this environment. Pass `{ storage }` explicitly (tests, SSR, webviews).',
		)
	}
	return storage
}

/**
 * Web / H5 adapter backed by `sessionStorage`. Data lives per tab and is
 * cleared when the tab closes — use it for "once per visit" style capping.
 *
 * Throws at construction when `sessionStorage` is unavailable and no `storage`
 * option was given; failures during operation are reported via `onError`
 * instead of thrown.
 */
export function sessionStorageAdapter(options: WebStorageAdapterOptions = {}): SyncStorage {
	const storage = options.storage ?? requireSessionStorage()
	return webStorageAdapter(() => storage, options.onError)
}
