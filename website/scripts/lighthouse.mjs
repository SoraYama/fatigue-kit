import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const reports = mkdtempSync(join(tmpdir(), 'fatigue-kit-lighthouse-'))
const server = spawn(process.execPath, ['scripts/static-server.mjs'], {
  cwd: root,
  stdio: 'ignore',
})

try {
  await waitFor('http://127.0.0.1:4322/fatigue-kit/')
  for (const [name, path] of [['home', ''], ['docs', 'docs/'], ['playground', 'playground/']]) {
    const output = join(reports, `${name}.json`)
    execFileSync(
      'npx',
      [
        'lighthouse',
        `http://127.0.0.1:4322/fatigue-kit/${path}`,
        '--chrome-flags=--headless --no-sandbox',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--output=json',
        `--output-path=${output}`,
        '--quiet',
      ],
      { cwd: root, stdio: 'inherit' },
    )
    const report = JSON.parse(readFileSync(output, 'utf8'))
    const minimum = { performance: 0.9, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 }
    for (const [category, score] of Object.entries(minimum)) {
      const actual = report.categories[category].score
      if (actual < score) throw new Error(`${name} ${category}: ${actual} < ${score}`)
    }
    const cls = report.audits['cumulative-layout-shift'].numericValue
    const lcp = report.audits['largest-contentful-paint'].numericValue
    if (cls > 0.1) throw new Error(`${name} CLS: ${cls} > 0.1`)
    if (lcp > 2500) throw new Error(`${name} LCP: ${lcp} > 2500ms`)
  }
  console.log('Lighthouse thresholds passed')
} finally {
  server.kill()
  rmSync(reports, { recursive: true, force: true })
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Server did not start: ${url}`)
}
