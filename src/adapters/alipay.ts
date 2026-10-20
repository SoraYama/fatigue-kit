import type { SyncStorage } from '../types'

/** Alipay mini-program storage API (object arguments, values wrapped in `{ data }`). */
export interface AlipayStorageLike {
	getStorageSync(options: { key: string }): unknown
	setStorageSync(options: { key: string; data: string }): void
	removeStorageSync(options: { key: string }): void
	getStorageInfoSync?(): { keys?: string[] }
}

export interface AlipayAdapterOptions {
	/** Defaults to the `my` global; inject explicitly in tests or abstractions. */
	client?: AlipayStorageLike
	onError?: (error: unknown) => void
}

declare const my: AlipayStorageLike | undefined

/** Alipay mini-program adapter backed by `my.getStorageSync` & friends. */
export function alipayAdapter(options: AlipayAdapterOptions = {}): SyncStorage {
	const client = options.client ?? (typeof my !== 'undefined' && my !== null ? my : undefined)
	if (client === undefined) {
		throw new Error(
			'[fatigue-kit] alipayAdapter: no `my` global found. Pass `{ client }` explicitly when not running inside Alipay.',
		)
	}
	const onError =
		options.onError ??
		((error: unknown) => {
			console.warn('[fatigue-kit] alipay storage operation failed:', error)
		})
	return {
		get(key) {
			try {
				const response = client.getStorageSync({ key }) as { data?: unknown } | null | undefined
				const data = response?.data
				return typeof data === 'string' && data.length > 0 ? data : null
			} catch (error) {
				onError(error)
				return null
			}
		},
		set(key, value) {
			try {
				client.setStorageSync({ key, data: value })
			} catch (error) {
				onError(error)
			}
		},
		remove(key) {
			try {
				client.removeStorageSync({ key })
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
