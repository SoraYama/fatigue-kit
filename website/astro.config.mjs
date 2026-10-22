import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

const repository = 'https://github.com/SoraYama/fatigue-kit'

export default defineConfig({
  site: 'https://sorayama.github.io',
  base: '/fatigue-kit',
  integrations: [
    react(),
    sitemap(),
    starlight({
      title: 'fatigue-kit',
      description: 'Zero-dependency frequency capping for every JavaScript runtime.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        'zh-cn': { label: '简体中文', lang: 'zh-CN' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: repository }],
      editLink: { baseUrl: `${repository}/edit/main/website/` },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Start',
          translations: { 'zh-cn': '开始' },
          items: [
            { label: 'Introduction', translations: { 'zh-cn': '介绍' }, link: '/docs/' },
            {
              label: 'Quick start',
              translations: { 'zh-cn': '快速开始' },
              link: '/docs/quick-start/',
            },
          ],
        },
        {
          label: 'Guides',
          translations: { 'zh-cn': '指南' },
          items: [
            { label: 'Compose rules', translations: { 'zh-cn': '组合规则' }, link: '/docs/guides/rules/' },
            { label: 'Choose an adapter', translations: { 'zh-cn': '选择适配器' }, link: '/docs/guides/platforms/' },
            { label: 'Test rule sets', translations: { 'zh-cn': '测试规则' }, link: '/docs/guides/testing/' },
          ],
        },
        {
          label: 'API',
          items: [
            { label: 'Core API', translations: { 'zh-cn': '核心 API' }, link: '/docs/api/core/' },
            { label: 'React bindings', translations: { 'zh-cn': 'React bindings' }, link: '/docs/api/react/' },
          ],
        },
        {
          label: 'Project',
          translations: { 'zh-cn': '项目' },
          items: [
            { label: 'Changelog', translations: { 'zh-cn': '更新日志' }, link: '/changelog/' },
            { label: 'Roadmap', translations: { 'zh-cn': '路线图' }, link: '/roadmap/' },
            {
              label: 'Playground',
              translations: { 'zh-cn': '演练场' },
              link: '/playground/',
            },
          ],
        },
      ],
    }),
  ],
})
