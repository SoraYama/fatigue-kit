import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { alipayAdapter } from '../src/adapters/alipay'
import { asyncStorageAdapter } from '../src/adapters/async-storage'
import { localStorageAdapter } from '../src/adapters/local-storage'
import { memoryAdapter } from '../src/adapters/memory'
import { fileAdapter } from '../src/adapters/node-file'
import { sessionStorageAdapter } from '../src/adapters/session-storage'
import { weappAdapter } from '../src/adapters/weapp'
import { createFatigue } from '../src/engine'
import { encodeRecord } from '../src/record'

class FakeWebStorage implements Storage {
	private map = new Map<string, string>()
	failing = false

	get length(): number {
		return this.map.size
	}

	key(index: number): string | null {
		return [...this.map.keys()][index] ?? null
	}

	getItem(key: string): string | null {
		if (this.failing) throw new Error('quota exceeded')
		return this.map.get(key) ?? null
	}

	setItem(key: string, value: string): void {
		if (this.failing) throw new Error('quota exceeded')
		this.map.set(key, value)
	}

	removeItem(key: string): void {
		if (this.failing) throw new Error('quota exceeded')
		this.map.delete(key)
	}

	clear(): void {
		this.map.clear()
	}
}

function fakeWeappClient() {
	const map = new Map<string, string>()
	return {
		map,
		getStorageSync: (key: string) => map.get(key) ?? '',
		setStorageSync: (key: string, value: string) => {
			map.set(key, value)
		},
		removeStorageSync: (key: string) => {
			map.delete(key)
		},
		getStorageInfoSync: () => ({ keys: [...map.keys()] }),
	}
}

function fakeAlipayClient() {
	const map = new Map<string, string>()
	return {
		map,
		getStorageSync: ({ key }: { key: string }) => ({ data: map.get(key) }),
		setStorageSync: ({ key, data }: { key: string; data: string }) => {
			map.set(key, data)
		},
		removeStorageSync: ({ key }: { key: string }) => {
			map.delete(key)
		},
		getStorageInfoSync: () => ({ keys: [...map.keys()] }),
	}
}

function throwingClient(message: string) {
	const fail = () => {
		throw new Error(message)
	}
	return {
		getStorageSync: fail,
		setStorageSync: fail,
		removeStorageSync: fail,
		getStorageInfoSync: fail,
	}
}

function fakeAsyncClient(initial: Record<string, string> = {}) {
	const map = new Map(Object.entries(initial))
	return {
		map,
		async getItem(key: string): Promise<string | null> {
			return map.get(key) ?? null
		},
		async setItem(key: string, value: string): Promise<void> {
			map.set(key, value)
		},
		async removeItem(key: string): Promise<void> {
			map.delete(key)
		},
	}
}

describe('memoryAdapter', () => {
	it('behaves as a plain KV store', () => {
		const storage = memoryAdapter({ seed: '1' })
		expect(storage.get('seed')).toBe('1')
		storage.set('a', 'x')
		expect(storage.get('a')).toBe('x')
		storage.remove('a')
		expect(storage.get('a')).toBeNull()
		expect(storage.keys?.()).toContain('seed')
		expect(storage.dump()).toEqual({ seed: '1' })
	})
})

describe('localStorageAdapter / sessionStorageAdapter', () => {
	it('roundtrips through the engine and prefixes keys', () => {
		const webStorage = new FakeWebStorage()
		const clock = { now: () => 1000 }
		const fatigue = createFatigue({ storage: localStorageAdapter({ storage: webStorage }), clock })
		expect(fatigue.tryConsume('k', [{ max: 1, window: '1h' }]).allowed).toBe(true)

		expect(webStorage.getItem('fatigue-kit:k')).not.toBeNull()
		expect(webStorage.key(0)).toBe('fatigue-kit:k')

		const second = createFatigue({ storage: localStorageAdapter({ storage: webStorage }), clock })
		expect(second.peek('k', [{ max: 1, window: '1h' }]).allowed).toBe(false)
		second.reset()
		expect(webStorage.length).toBe(0)
	})

	it('works for sessionStorage the same way', () => {
		const webStorage = new FakeWebStorage()
		const fatigue = createFatigue({ storage: sessionStorageAdapter({ storage: webStorage }) })
		expect(fatigue.tryConsume('k', [{ max: 1 }]).allowed).toBe(true)
		expect(webStorage.getItem('fatigue-kit:k')).not.toBeNull()
	})

	it('degrades gracefully when the storage throws', () => {
		const webStorage = new FakeWebStorage()
		const errors: unknown[] = []
		const fatigue = createFatigue({
			storage: localStorageAdapter({ storage: webStorage, onError: (e) => errors.push(e) }),
		})
		webStorage.failing = true
		expect(() => fatigue.tryConsume('k', [{ max: 1 }])).not.toThrow()
		expect(errors.length).toBeGreaterThan(0)
	})

	it('throws a helpful error when the global storage is missing', () => {
		// Node.js ≥22 exposes a global `localStorage`, so hide both for this test.
		const globalRef = globalThis as Record<string, unknown>
		const savedLocal = globalRef.localStorage
		const savedSession = globalRef.sessionStorage
		delete globalRef.localStorage
		delete globalRef.sessionStorage
		try {
			expect(() => localStorageAdapter()).toThrow(/localStorage/)
			expect(() => sessionStorageAdapter()).toThrow(/sessionStorage/)
		} finally {
			if (savedLocal !== undefined) globalRef.localStorage = savedLocal
			if (savedSession !== undefined) globalRef.sessionStorage = savedSession
		}
	})
})

describe('asyncStorageAdapter', () => {
	it('hydrates on ready, writes back on flush, tracks an index', async () => {
		// A fixed clock keeps the expected records deterministic.
		const now = 1_700_000_000_000
		const clock = { now: () => now }
		const seeded = encodeRecord({ v: 1, hits: [now], lifetime: 1 })
		const client = fakeAsyncClient({
			'fatigue-kit:__index__': JSON.stringify(['fatigue-kit:a']),
			'fatigue-kit:a': seeded,
		})
		const handle = asyncStorageAdapter(client)

		// Synchronous reads are served from the (still empty) cache before ready.
		expect(handle.storage.get('fatigue-kit:a')).toBeNull()
		await handle.ready
		expect(handle.storage.get('fatigue-kit:a')).toBe(seeded)

		const fatigue = createFatigue({ storage: handle.storage, clock })
		expect(fatigue.peek('a', [{ max: 1, window: '1h' }]).allowed).toBe(false)
		expect(fatigue.tryConsume('b', [{ max: 1, window: '1h' }]).allowed).toBe(true)

		// Writes are buffered until flush.
		expect(client.map.has('fatigue-kit:b')).toBe(false)
		await handle.flush()
		expect(client.map.get('fatigue-kit:b')).toBe(encodeRecord({ v: 1, hits: [now], lifetime: 1 }))
		const rawIndex = client.map.get('fatigue-kit:__index__')
		expect(JSON.parse(rawIndex ?? '[]')).toContain('fatigue-kit:b')

		// A second handle over the same backend sees the flushed state.
		const second = asyncStorageAdapter(client)
		await second.ready
		expect(second.storage.get('fatigue-kit:b')).not.toBeNull()
		second.storage.remove('fatigue-kit:b')
		await second.flush()
		expect(client.map.has('fatigue-kit:b')).toBe(false)
	})

	it('survives a corrupt index', async () => {
		const client = fakeAsyncClient({ 'fatigue-kit:__index__': '{broken' })
		const handle = asyncStorageAdapter(client)
		await expect(handle.ready).resolves.toBeUndefined()
		expect(handle.storage.get('anything')).toBeNull()
	})

	it('reports backend failures during hydration and flush', async () => {
		const errors: unknown[] = []
		const client = {
			getItem: async () => {
				throw new Error('read failed')
			},
			setItem: async () => {
				throw new Error('write failed')
			},
			removeItem: async () => {
				throw new Error('remove failed')
			},
		}
		const handle = asyncStorageAdapter(client, {
			flushDelay: 60_000,
			onError: (error) => errors.push(error),
		})
		await handle.ready
		handle.storage.set('fatigue-kit:a', 'value')
		handle.storage.remove('fatigue-kit:a')
		await expect(handle.flush()).resolves.toBeUndefined()
		expect(errors).toHaveLength(3)
	})
})

describe('weappAdapter', () => {
	it('plugs into the engine via the sync wx-style API', () => {
		const client = fakeWeappClient()
		const fatigue = createFatigue({ storage: weappAdapter({ client }) })
		const rules = [{ max: 1, window: '1h' as const }]
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)
		expect(typeof client.map.get('fatigue-kit:k')).toBe('string')
		expect(fatigue.tryConsume('k', rules).allowed).toBe(false)
		const keys = weappAdapter({ client }).keys?.() ?? []
		expect(keys).toContain('fatigue-kit:k')
	})

	it('reports every client failure without throwing', () => {
		const errors: unknown[] = []
		const storage = weappAdapter({
			client: throwingClient('wx failure'),
			onError: (error) => errors.push(error),
		})
		expect(storage.get('k')).toBeNull()
		expect(() => storage.set('k', 'v')).not.toThrow()
		expect(() => storage.remove('k')).not.toThrow()
		expect(storage.keys?.()).toEqual([])
		expect(errors).toHaveLength(4)
	})

	it('requires the wx global or an injected client', () => {
		expect(() => weappAdapter().get('k')).toThrow(/wx/)
	})
})

describe('alipayAdapter', () => {
	it('unwraps the { data } envelope of the my-style API', () => {
		const client = fakeAlipayClient()
		const fatigue = createFatigue({ storage: alipayAdapter({ client }) })
		const rules = [{ max: 1, window: '1h' as const }]
		expect(fatigue.tryConsume('k', rules).allowed).toBe(true)
		expect(client.map.get('fatigue-kit:k')).not.toBeUndefined()
		expect(fatigue.tryConsume('k', rules).allowed).toBe(false)
		const storage = alipayAdapter({ client })
		expect(storage.keys?.()).toContain('fatigue-kit:k')
		storage.remove('fatigue-kit:k')
		expect(storage.get('fatigue-kit:k')).toBeNull()
	})

	it('reports every client failure without throwing', () => {
		const errors: unknown[] = []
		const storage = alipayAdapter({
			client: throwingClient('my failure'),
			onError: (error) => errors.push(error),
		})
		expect(storage.get('k')).toBeNull()
		expect(() => storage.set('k', 'v')).not.toThrow()
		expect(() => storage.remove('k')).not.toThrow()
		expect(storage.keys?.()).toEqual([])
		expect(errors).toHaveLength(4)
	})

	it('requires the my global or an injected client', () => {
		expect(() => alipayAdapter().get('k')).toThrow(/my/)
	})
})

describe('fileAdapter', () => {
	it('persists to disk and creates parent directories', () => {
		const dir = mkdtempSync(join(tmpdir(), 'fatigue-kit-'))
		try {
			const file = join(dir, 'nested', 'state.json')
			const storage = fileAdapter(file)
			storage.set('a', '1')
			expect(readFileSync(file, 'utf8')).toBe('{"a":"1"}')

			// A fresh instance reads from disk, not from any cache.
			expect(fileAdapter(file).get('a')).toBe('1')
			expect(storage.keys?.()).toEqual(['a'])
			storage.remove('a')
			expect(fileAdapter(file).get('a')).toBeNull()
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	it('recovers from corrupt data and can pretty-print records', () => {
		const dir = mkdtempSync(join(tmpdir(), 'fatigue-kit-'))
		try {
			const file = join(dir, 'state.json')
			writeFileSync(file, '{broken', 'utf8')
			const storage = fileAdapter(file, { pretty: true })
			expect(storage.get('missing')).toBeNull()
			storage.set('a', '1')
			expect(readFileSync(file, 'utf8')).toContain('\n  "a": "1"\n')
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})
})
