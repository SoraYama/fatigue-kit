import type { SyncStorage } from '../types'

/** WeChat mini-program storage API (positional arguments). */
export interface WeappStorageLike {
	getStorageSync(key: string): unknown
	setStorageSync(key: string, value: string): void
	removeStorageSync(key: string): void
	getStorageInfoSync?(): { keys?: string[] }
}

export interface WeappAdapterOptions {
	/** Defaults to the `wx` global; inject explicitly in tests or abstractions. */
	client?: WeappStorageLike
	onError?: (error: unknown) => void
}

declare const wx: WeappStorageLike | undefined

/**
 * WeChat mini-program adapter backed by `wx.getStorageSync` & friends.
 * Synchronous native API, so it plugs straight into the sync core.
 */
export function weappAdapter(options: WeappAdapterOptions = {}): SyncStorage {
	const client = options.client ?? (typeof wx !== 'undefined' && wx !== null ? wx : undefined)
	if (client === undefined) {
		throw new Error(
			'[fatigue-kit] weappAdapter: no `wx` global found. Pass `{ client }` explicitly when not running inside WeChat.',
		)
	}
	const onError =
		options.onError ??
		((error: unknown) => {
			console.warn('[fatigue-kit] weapp storage operation failed:', error)
		})
	return {
		get(key) {
			try {
				const value = client.getStorageSync(key)
				return typeof value === 'string' && value.length > 0 ? value : null
			} catch (error) {
				onError(error)
				return null
			}
		},
		set(key, value) {
			try {
				client.setStorageSync(key, value)
			} catch (error) {
				onError(error)
			}
		},
		remove(key) {
			try {
				client.removeStorageSync(key)
			} catch (error) {
				onError(error)
			}
		},
		keys() {
			try {
				return client.getStorageInfoSync?.().keys ?? []
			} catch (error) {
				onError(error)
				return []
			}
		},
	}
}
