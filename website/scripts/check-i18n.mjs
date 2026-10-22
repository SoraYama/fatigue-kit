import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const content = resolve(import.meta.dirname, '../src/content/docs')
const english = join(content, 'docs')
const chinese = join(content, 'zh-CN/docs')
const failures = []

for (const file of markdownFiles(english)) {
  const counterpart = join(chinese, relative(english, file))
  if (!existsSync(counterpart)) failures.push(`Missing zh-CN translation: ${relative(english, file)}`)
  validate(file)
}
for (const file of markdownFiles(chinese)) {
  const counterpart = join(english, relative(chinese, file))
  if (!existsSync(counterpart)) failures.push(`Missing English source: ${relative(chinese, file)}`)
  validate(file)
}
if (failures.length > 0) throw new Error(failures.join('\n'))
console.log('English and zh-CN documentation are structurally aligned')

function validate(file) {
  const source = readFileSync(file, 'utf8')
  if (!/^---\n[\s\S]*?title:\s*.+\n[\s\S]*?description:\s*.+\n---/m.test(source)) {
    failures.push(`Missing title/description frontmatter: ${relative(content, file)}`)
  }
}

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(path) : path.endsWith('.mdx') ? [path] : []
  })
}
