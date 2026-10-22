import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const version = process.argv[2]
if (version !== '18' && version !== '19') throw new Error('Pass React version 18 or 19')
const root = resolve(import.meta.dirname, '..')
const directory = mkdtempSync(join(tmpdir(), `fatigue-kit-react-${version}-`))

try {
	writeFileSync(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
	const corePack = pack(root)
	const reactPack = pack(join(root, 'packages/react'))
	run(
		'npm',
		[
			'install',
			'--no-audit',
			'--no-fund',
			`react@${version}`,
			`react-dom@${version}`,
			corePack,
			reactPack,
		],
		directory,
	)
	writeFileSync(
		join(directory, 'test.mjs'),
		`
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createFatigue } from 'fatigue-kit'
import { FatigueProvider } from 'fatigue-kit-react'
assert.match(renderToString(createElement(FatigueProvider, { value: createFatigue() }, createElement('span', null, 'ok'))), /ok/)
`,
	)
	run(process.execPath, ['test.mjs'], directory)
	console.log(`React ${version} consumer passed`)
} finally {
	rmSync(directory, { recursive: true, force: true })
}

function pack(cwd) {
	const result = execFileSync('npm', ['pack', '--json', '--pack-destination', directory], {
		cwd,
		encoding: 'utf8',
	})
	return join(directory, JSON.parse(result)[0].filename)
}

function run(command, args, cwd) {
	execFileSync(command, args, { cwd, stdio: 'inherit' })
}
