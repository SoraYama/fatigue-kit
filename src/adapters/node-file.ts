import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { SyncStorage } from '../types'

export interface FileAdapterOptions {
	/** Pretty-print the backing JSON file. Default `false`. */
	pretty?: boolean
	onError?: (error: unknown) => void
}

/**
 * Node.js adapter persisting all records in a single JSON file.
 * Writes go through a temp file + rename, so a crash never leaves a
 * half-written file behind. The first access creates parent directories.
 */
export function fileAdapter(filePath: string, options: FileAdapterOptions = {}): SyncStorage {
	const onError =
		options.onError ??
		((error: unknown) => {
			console.warn('[fatigue-kit] file storage operation failed:', error)
		})
	let cache: Record<string, string> | null = null

	const load = (): Record<string, string> => {
		if (cache !== null) return cache
		try {
			const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'))
			cache =
				parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, string>) : {}
		} catch {
			cache = {}
		}
		return cache
	}

	const persist = (): void => {
		try {
			mkdirSync(dirname(filePath), { recursive: true })
			const tempPath = `${filePath}.${process.pid}.tmp`
			writeFileSync(
				tempPath,
				JSON.stringify(load(), null, options.pretty === true ? 2 : undefined),
				'utf8',
			)
			renameSync(tempPath, filePath)
		} catch (error) {
			onError(error)
		}
	}

	return {
		get: (key) => load()[key] ?? null,
		set: (key, value) => {
			load()[key] = value
			persist()
		},
		remove: (key) => {
			delete load()[key]
			persist()
		},
		keys: () => Object.keys(load()),
	}
}
