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
            { label: 'Installation', translations: { 'zh-cn': '安装' }, link: '/docs/getting-started/installation/' },
            { label: 'Quick start', translations: { 'zh-cn': '快速开始' }, link: '/docs/quick-start/' },
            { label: 'Core concepts', translations: { 'zh-cn': '核心概念' }, link: '/docs/getting-started/core-concepts/' },
            { label: 'Glossary', translations: { 'zh-cn': '中英术语表' }, link: '/docs/glossary/' },
          ],
        },
        {
          label: 'Rules',
          translations: { 'zh-cn': '规则' },
          items: [
            { label: 'Sliding windows', translations: { 'zh-cn': '滑动窗口' }, link: '/docs/rules/sliding-windows/' },
            { label: 'Calendar limits', translations: { 'zh-cn': '自然周期限制' }, link: '/docs/rules/calendar/' },
            { label: 'Cooldown', translations: { 'zh-cn': '冷却期' }, link: '/docs/rules/cooldown/' },
            { label: 'Lifetime caps', translations: { 'zh-cn': '生命周期上限' }, link: '/docs/rules/lifetime/' },
            { label: 'Combining rules', translations: { 'zh-cn': '组合规则' }, link: '/docs/rules/combining/' },
            { label: 'Calendar cutoff', translations: { 'zh-cn': '周期截止时间' }, link: '/docs/rules/cutoff/' },
            { label: 'Week starts on', translations: { 'zh-cn': '每周起始日' }, link: '/docs/rules/week-starts-on/' },
            { label: 'Result semantics', translations: { 'zh-cn': '返回结果语义' }, link: '/docs/rules/result-semantics/' },
          ],
        },
        {
          label: 'Platforms',
          translations: { 'zh-cn': '平台' },
          items: [
            { label: 'Web', link: '/docs/platforms/web/' },
            { label: 'React Native', link: '/docs/platforms/react-native/' },
            { label: 'WeChat', translations: { 'zh-cn': '微信小程序' }, link: '/docs/platforms/wechat/' },
            { label: 'Alipay', translations: { 'zh-cn': '支付宝小程序' }, link: '/docs/platforms/alipay/' },
            { label: 'Node.js', link: '/docs/platforms/node/' },
            { label: 'SSR', link: '/docs/platforms/ssr/' },
            { label: 'Custom storage', translations: { 'zh-cn': '自定义存储' }, link: '/docs/platforms/custom-storage/' },
          ],
        },
        {
          label: 'Operations',
          translations: { 'zh-cn': '运维与迁移' },
          items: [
            { label: 'Legacy migration', translations: { 'zh-cn': '旧版迁移' }, link: '/docs/operations/legacy-migration/' },
            { label: 'Error handling', translations: { 'zh-cn': '错误处理' }, link: '/docs/operations/error-handling/' },
            { label: 'Corrupt storage', translations: { 'zh-cn': '损坏的存储数据' }, link: '/docs/operations/corrupt-storage/' },
            { label: 'Record pruning', translations: { 'zh-cn': '记录裁剪' }, link: '/docs/operations/pruning/' },
            { label: 'Troubleshooting', translations: { 'zh-cn': '故障排查' }, link: '/docs/operations/troubleshooting/' },
          ],
        },
        {
          label: 'React',
          items: [
            { label: 'Strict Mode', link: '/docs/react/strict-mode/' },
            { label: 'SSR and hydration', translations: { 'zh-cn': 'SSR 与水合' }, link: '/docs/react/ssr-hydration/' },
            { label: 'Testing', translations: { 'zh-cn': '测试' }, link: '/docs/react/testing/' },
          ],
        },
        {
          label: 'API',
          items: [
            { label: 'Core API', translations: { 'zh-cn': '核心 API' }, link: '/docs/api/core/' },
            { label: 'React bindings', translations: { 'zh-cn': 'React 绑定' }, link: '/docs/api/react/' },
          ],
        },
        {
          label: 'Project',
          translations: { 'zh-cn': '项目' },
          items: [
            { label: 'Compatibility', translations: { 'zh-cn': '兼容性' }, link: '/docs/project/compatibility/' },
            { label: 'Known limitations', translations: { 'zh-cn': '已知限制' }, link: '/docs/project/known-limitations/' },
            { label: 'Release policy', translations: { 'zh-cn': '发布策略' }, link: '/docs/project/release-policy/' },
            { label: 'Changelog', translations: { 'zh-cn': '更新日志' }, link: '/changelog/' },
            { label: 'Roadmap', translations: { 'zh-cn': '路线图' }, link: '/roadmap/' },
            { label: 'Playground', translations: { 'zh-cn': '演练场' }, link: '/playground/' },
          ],
        },
      ],
    }),
  ],
})
