import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const workspace = mkdtempSync(join(tmpdir(), 'fatigue-kit-react-smoke-'))

function run(command, args, cwd = root) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'inherit'],
	}).trim()
}

try {
	run('npm', ['run', 'build'])
	run('npm', ['run', 'build:react'])
	const core = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', workspace]))[0]
	const react = JSON.parse(
		run('npm', ['pack', '--json', '--pack-destination', workspace], join(root, 'packages/react')),
	)[0]
	const reactPaths = new Set(react.files.map(({ path }) => path))
	for (const target of ['./dist/index.js', './dist/index.cjs', './dist/index.d.ts']) {
		if (!reactPaths.has(target.slice(2))) throw new Error(`Missing React package target: ${target}`)
	}
	const bundle = readFileSync(join(root, 'packages/react/dist/index.js'), 'utf8')
	if (!/from ["']react["']/.test(bundle))
		throw new Error('React was bundled instead of externalized')

	const consumer = join(workspace, 'consumer')
	mkdirSync(consumer)
	run('npm', ['init', '-y'], consumer)
	run(
		'npm',
		[
			'install',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			join(workspace, core.filename),
			join(workspace, react.filename),
			'react@19',
			'react-dom@19',
		],
		consumer,
	)
	writeFileSync(
		join(consumer, 'consumer.mjs'),
		`import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createFatigue } from 'fatigue-kit'
import { FatigueProvider } from 'fatigue-kit-react'
assert.match(renderToString(createElement(FatigueProvider, { value: createFatigue() }, createElement('span', null, 'ok'))), /ok/)
`,
	)
	run(process.execPath, ['consumer.mjs'], consumer)
	console.log('React packed-package smoke tests passed')
} finally {
	rmSync(workspace, { recursive: true, force: true })
}
