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
      defaultLocale: 'en',
      locales: {
        en: { label: 'English', lang: 'en' },
        'zh-CN': { label: '简体中文', lang: 'zh-CN' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: repository }],
      editLink: { baseUrl: `${repository}/edit/main/website/` },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Start',
          translations: { 'zh-CN': '开始' },
          items: [
            { label: 'Introduction', translations: { 'zh-CN': '介绍' }, link: '/docs/' },
            {
              label: 'Quick start',
              translations: { 'zh-CN': '快速开始' },
              link: '/docs/quick-start/',
            },
          ],
        },
        {
          label: 'Guides',
          items: [{ autogenerate: { directory: 'guides' } }],
        },
        {
          label: 'API',
          items: [{ autogenerate: { directory: 'api' } }],
        },
        {
          label: 'Project',
          translations: { 'zh-CN': '项目' },
          items: [
            { label: 'Changelog', translations: { 'zh-CN': '更新日志' }, link: '/changelog/' },
            { label: 'Roadmap', translations: { 'zh-CN': '路线图' }, link: '/roadmap/' },
            {
              label: 'Playground',
              translations: { 'zh-CN': '演练场' },
              link: '/playground/',
            },
          ],
        },
      ],
    }),
  ],
})
