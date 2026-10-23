import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const html = readFileSync(resolve(import.meta.dirname, '../dist/zh-cn/docs/index.html'), 'utf8')
const expected = ['开始', '介绍', '安装', '规则', '滑动窗口', '平台', '运维与迁移', '项目', '路线图']
const forbidden = ['>Start<', '>Introduction<', '>Installation<', '>Rules<', '>Sliding windows<', '>Platforms<', '>Operations<', '>Project<', '>Roadmap<']
const failures = [
  ...expected.filter((label) => !html.includes(`>${label}<`)).map((label) => `Missing Chinese sidebar label: ${label}`),
  ...forbidden.filter((label) => html.includes(label)).map((label) => `English sidebar label leaked: ${label.slice(1, -1)}`),
]
if (failures.length > 0) throw new Error(failures.join('\n'))
console.log('Chinese sidebar labels are localized')
