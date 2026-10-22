import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const dist = resolve(import.meta.dirname, '../dist')
const base = '/fatigue-kit'
const htmlFiles = walk(dist).filter((path) => path.endsWith('.html'))
const failures = []

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8')
  for (const match of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = match[1]
    if (href === undefined || /^(?:https?:|mailto:|#|javascript:)/.test(href)) continue
    const path = href.split(/[?#]/, 1)[0]
    if (
      path === undefined ||
      path === '' ||
      path.includes('/_astro/') ||
      /\.(?:css|js|svg|xml|png|jpe?g|webp|ico)$/.test(path)
    ) continue
    const target = path.startsWith('/')
      ? resolveAbsolute(path)
      : resolveRelative(file, path)
    if (!existsSync(target)) {
      failures.push(`${relative(dist, file)} -> ${href}`)
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Broken internal links:\n${failures.join('\n')}`)
}
console.log(`Checked internal links in ${htmlFiles.length} HTML files`)

function resolveAbsolute(path) {
  const withoutBase = path === base ? '/' : path.startsWith(`${base}/`) ? path.slice(base.length) : path
  return toOutputPath(join(dist, withoutBase))
}

function resolveRelative(file, path) {
  return toOutputPath(resolve(dirname(file), path))
}

function toOutputPath(path) {
  if (path.endsWith('.html')) return path
  return join(path, 'index.html')
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}
