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
          translations: { 'zh-CN': '开始' },
          items: [
            { label: 'Introduction', translations: { 'zh-CN': '介绍' }, link: '/docs/' },
            { label: 'Installation', translations: { 'zh-CN': '安装' }, link: '/docs/getting-started/installation/' },
            { label: 'Quick start', translations: { 'zh-CN': '快速开始' }, link: '/docs/quick-start/' },
            { label: 'Core concepts', translations: { 'zh-CN': '核心概念' }, link: '/docs/getting-started/core-concepts/' },
            { label: 'Glossary', translations: { 'zh-CN': '中英术语表' }, link: '/docs/glossary/' },
          ],
        },
        {
          label: 'Rules',
          translations: { 'zh-CN': '规则' },
          items: [
            { label: 'Sliding windows', translations: { 'zh-CN': '滑动窗口' }, link: '/docs/rules/sliding-windows/' },
            { label: 'Calendar limits', translations: { 'zh-CN': '自然周期限制' }, link: '/docs/rules/calendar/' },
            { label: 'Cooldown', translations: { 'zh-CN': '冷却期' }, link: '/docs/rules/cooldown/' },
            { label: 'Lifetime caps', translations: { 'zh-CN': '生命周期上限' }, link: '/docs/rules/lifetime/' },
            { label: 'Combining rules', translations: { 'zh-CN': '组合规则' }, link: '/docs/rules/combining/' },
            { label: 'Calendar cutoff', translations: { 'zh-CN': '周期截止时间' }, link: '/docs/rules/cutoff/' },
            { label: 'Week starts on', translations: { 'zh-CN': '每周起始日' }, link: '/docs/rules/week-starts-on/' },
            { label: 'Result semantics', translations: { 'zh-CN': '返回结果语义' }, link: '/docs/rules/result-semantics/' },
          ],
        },
        {
          label: 'Platforms',
          translations: { 'zh-CN': '平台' },
          items: [
            { label: 'Web', link: '/docs/platforms/web/' },
            { label: 'React Native', link: '/docs/platforms/react-native/' },
            { label: 'WeChat', translations: { 'zh-CN': '微信小程序' }, link: '/docs/platforms/wechat/' },
            { label: 'Alipay', translations: { 'zh-CN': '支付宝小程序' }, link: '/docs/platforms/alipay/' },
            { label: 'Node.js', link: '/docs/platforms/node/' },
            { label: 'SSR', link: '/docs/platforms/ssr/' },
            { label: 'Custom storage', translations: { 'zh-CN': '自定义存储' }, link: '/docs/platforms/custom-storage/' },
          ],
        },
        {
          label: 'Operations',
          translations: { 'zh-CN': '运维与迁移' },
          items: [
            { label: 'Legacy migration', translations: { 'zh-CN': '旧版迁移' }, link: '/docs/operations/legacy-migration/' },
            { label: 'Error handling', translations: { 'zh-CN': '错误处理' }, link: '/docs/operations/error-handling/' },
            { label: 'Corrupt storage', translations: { 'zh-CN': '损坏的存储数据' }, link: '/docs/operations/corrupt-storage/' },
            { label: 'Record pruning', translations: { 'zh-CN': '记录裁剪' }, link: '/docs/operations/pruning/' },
            { label: 'Troubleshooting', translations: { 'zh-CN': '故障排查' }, link: '/docs/operations/troubleshooting/' },
          ],
        },
        {
          label: 'React',
          items: [
            { label: 'Strict Mode', link: '/docs/react/strict-mode/' },
            { label: 'SSR and hydration', translations: { 'zh-CN': 'SSR 与水合' }, link: '/docs/react/ssr-hydration/' },
            { label: 'Testing', translations: { 'zh-CN': '测试' }, link: '/docs/react/testing/' },
          ],
        },
        {
          label: 'API',
          items: [
            { label: 'Core API', translations: { 'zh-CN': '核心 API' }, link: '/docs/api/core/' },
            { label: 'React bindings', translations: { 'zh-CN': 'React 绑定' }, link: '/docs/api/react/' },
          ],
        },
        {
          label: 'Project',
          translations: { 'zh-CN': '项目' },
          items: [
            { label: 'Compatibility', translations: { 'zh-CN': '兼容性' }, link: '/docs/project/compatibility/' },
            { label: 'Known limitations', translations: { 'zh-CN': '已知限制' }, link: '/docs/project/known-limitations/' },
            { label: 'Release policy', translations: { 'zh-CN': '发布策略' }, link: '/docs/project/release-policy/' },
            { label: 'Changelog', translations: { 'zh-CN': '更新日志' }, link: '/changelog/' },
            { label: 'Roadmap', translations: { 'zh-CN': '路线图' }, link: '/roadmap/' },
            { label: 'Playground', translations: { 'zh-CN': '演练场' }, link: '/playground/' },
          ],
        },
      ],
    }),
  ],
})
