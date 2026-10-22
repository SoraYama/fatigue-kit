import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createContext, Script } from 'node:vm'

const root = resolve(import.meta.dirname, '..')
const workspace = mkdtempSync(join(tmpdir(), 'fatigue-kit-smoke-'))

function run(command, args, cwd = root) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'inherit'],
	}).trim()
}

try {
	run('npm', ['run', 'build'])
	const packResult = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', workspace]))[0]
	if (!packResult?.filename || !Array.isArray(packResult.files)) {
		throw new Error('npm pack did not return the expected manifest')
	}

	const tarball = join(workspace, packResult.filename)
	const packedPaths = new Set(packResult.files.map(({ path }) => path))
	const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

	for (const [subpath, target] of Object.entries(packageJson.exports)) {
		for (const exportedPath of typeof target === 'string' ? [target] : Object.values(target)) {
			const packedPath = exportedPath.replace(/^\.\//, '')
			if (subpath !== './package.json' && !packedPaths.has(packedPath)) {
				throw new Error(`Missing packed export target: ${subpath} -> ${packedPath}`)
			}
		}
	}

	const allowedRootFiles = new Set(['LICENSE', 'README.md', 'README.zh-CN.md', 'package.json'])
	const unexpected = [...packedPaths].filter(
		(path) => !allowedRootFiles.has(path) && !path.startsWith('dist/'),
	)
	if (unexpected.length > 0) {
		throw new Error(`Unexpected files in package: ${unexpected.join(', ')}`)
	}

	const consumer = join(workspace, 'consumer')
	mkdirSync(consumer)
	run('npm', ['init', '-y'], consumer)
	run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], consumer)

	writeFileSync(
		join(consumer, 'esm.mjs'),
		`import assert from 'node:assert/strict'
import { createFatigue, memoryAdapter, RECORD_VERSION } from 'fatigue-kit'
import { migrateLegacyRecord } from 'fatigue-kit/legacy'
import { memoryAdapter as memorySubpath } from 'fatigue-kit/adapters/memory'
import { localStorageAdapter } from 'fatigue-kit/adapters/local-storage'
import { sessionStorageAdapter } from 'fatigue-kit/adapters/session-storage'
import { asyncStorageAdapter } from 'fatigue-kit/adapters/async-storage'
import { weappAdapter } from 'fatigue-kit/adapters/weapp'
import { alipayAdapter } from 'fatigue-kit/adapters/alipay'
import { fileAdapter } from 'fatigue-kit/adapters/node-file'
import metadata from 'fatigue-kit/package.json' with { type: 'json' }

const fatigue = createFatigue({ storage: memoryAdapter() })
assert.equal(fatigue.tryConsume('esm', [{ max: 1 }]).allowed, true)
assert.equal(fatigue.tryConsume('esm', [{ max: 1 }]).allowed, false)
assert.equal(RECORD_VERSION, 1)
assert.equal(typeof migrateLegacyRecord, 'function')
assert.equal(typeof memorySubpath, 'function')
assert.equal(typeof localStorageAdapter, 'function')
assert.equal(typeof sessionStorageAdapter, 'function')
assert.equal(typeof asyncStorageAdapter, 'function')
assert.equal(typeof weappAdapter, 'function')
assert.equal(typeof alipayAdapter, 'function')
assert.equal(typeof fileAdapter, 'function')
assert.equal(metadata.name, 'fatigue-kit')
`,
	)
	run(process.execPath, ['esm.mjs'], consumer)

	writeFileSync(
		join(consumer, 'cjs.cjs'),
		`const assert = require('node:assert/strict')
const { createFatigue, memoryAdapter } = require('fatigue-kit')
const { migrateLegacyRecord } = require('fatigue-kit/legacy')
const adapters = [
  require('fatigue-kit/adapters/memory').memoryAdapter,
  require('fatigue-kit/adapters/local-storage').localStorageAdapter,
  require('fatigue-kit/adapters/session-storage').sessionStorageAdapter,
  require('fatigue-kit/adapters/async-storage').asyncStorageAdapter,
  require('fatigue-kit/adapters/weapp').weappAdapter,
  require('fatigue-kit/adapters/alipay').alipayAdapter,
  require('fatigue-kit/adapters/node-file').fileAdapter,
]
const fatigue = createFatigue({ storage: memoryAdapter() })
assert.equal(fatigue.tryConsume('cjs', [{ cooldown: '1h' }]).allowed, true)
assert.equal(fatigue.tryConsume('cjs', [{ cooldown: '1h' }]).allowed, false)
assert.equal(typeof migrateLegacyRecord, 'function')
assert.equal(adapters.every((adapter) => typeof adapter === 'function'), true)
`,
	)
	run(process.execPath, ['cjs.cjs'], consumer)

	writeFileSync(
		join(consumer, 'types.ts'),
		`import { createFatigue, memoryAdapter, type FatigueRule, type SyncStorage } from 'fatigue-kit'
import { migrateLegacyRecord, type LegacyFatigueRecord } from 'fatigue-kit/legacy'
import { localStorageAdapter, type WebStorageAdapterOptions } from 'fatigue-kit/adapters/local-storage'
import { asyncStorageAdapter, type AsyncStorageLike } from 'fatigue-kit/adapters/async-storage'
import { weappAdapter, type WeappStorageLike } from 'fatigue-kit/adapters/weapp'
import { alipayAdapter, type AlipayStorageLike } from 'fatigue-kit/adapters/alipay'
import { fileAdapter } from 'fatigue-kit/adapters/node-file'

const storage: SyncStorage = memoryAdapter()
const rules = [{ max: 1, every: 'day' }, { cooldown: '1h' }] satisfies FatigueRule[]
createFatigue({ storage }).peek('types', rules)
const legacy: LegacyFatigueRecord = { times: 1, date: '2026/10/22', duration: 1, todayCount: 1 }
migrateLegacyRecord(legacy)
const webOptions: WebStorageAdapterOptions = { storage: localStorage }
localStorageAdapter(webOptions)
const asyncClient: AsyncStorageLike = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} }
asyncStorageAdapter(asyncClient)
weappAdapter({ client: {} as WeappStorageLike })
alipayAdapter({ client: {} as AlipayStorageLike })
fileAdapter('./state.json')
`,
	)
	writeFileSync(
		join(consumer, 'tsconfig.json'),
		JSON.stringify(
			{
				compilerOptions: {
					target: 'ES2020',
					lib: ['ES2020', 'DOM'],
					module: 'ESNext',
					moduleResolution: 'Bundler',
					strict: true,
					noEmit: true,
					skipLibCheck: false,
					types: ['node'],
					typeRoots: [join(root, 'node_modules/@types')],
				},
				include: ['types.ts'],
			},
			null,
			2,
		),
	)
	run(join(root, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json'], consumer)

	const globalPath = join(consumer, 'node_modules/fatigue-kit/dist/global/index.global.js')
	const context = createContext({ console, setTimeout, clearTimeout })
	new Script(readFileSync(globalPath, 'utf8')).runInContext(context)
	if (typeof context.FatigueKit?.createFatigue !== 'function') {
		throw new Error('IIFE did not expose FatigueKit.createFatigue')
	}
	const globalFatigue = context.FatigueKit.createFatigue()
	if (!globalFatigue.tryConsume('global', [{ max: 1 }]).allowed) {
		throw new Error('IIFE core did not consume an allowed hit')
	}

	const installedDist = join(consumer, 'node_modules/fatigue-kit/dist')
	if (readdirSync(installedDist).length === 0) throw new Error('Installed dist is empty')
	console.log('Packed-package smoke tests passed')
} finally {
	rmSync(workspace, { recursive: true, force: true })
}
