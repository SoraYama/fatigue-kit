# fatigue-kit 文档站

[English](./README.md)

基于 Astro/Starlight 的双语文档与浏览器规则演练场。库包不包含统计代码；网站统计可选，在配置两项 Umami 参数前保持关闭。

## 运行与检查

在仓库根目录执行：

```sh
npm run build
npm run build:react
npm run dev --workspace @fatigue-kit/website
npm test --workspace @fatigue-kit/website
npm run build:website
npm run test:e2e --workspace @fatigue-kit/website
npm run lighthouse --workspace @fatigue-kit/website
```

## 申请 Umami Cloud 并接入

1. 打开 [Umami Cloud 注册页](https://cloud.umami.is/signup)，可使用 Google、GitHub 或邮箱注册，按自己的需要选择服务方案。
2. 在 **Websites → Add website** 添加站点：Name 填 `fatigue-kit`，Domain 填 `sorayama.github.io`。Domain 是域名，不填写 `/fatigue-kit/` 路径。[官方添加站点说明](https://docs.umami.is/docs/add-a-website)。
3. 编辑该站点，打开 **Tracking code**，复制脚本的 `src` 地址与 `data-website-id` 值。[官方获取统计代码说明](https://docs.umami.is/docs/collect-data)。
4. 打开本 GitHub 仓库的 **Settings → Secrets and variables → Actions → Variables**，新增以下两个 Repository variables。它们是公开的脚本配置，不是 API token 或密码。

| 变量名 | 从统计代码复制的值 |
| --- | --- |
| `PUBLIC_UMAMI_SCRIPT_URL` | 完整 HTTPS `src` 地址 |
| `PUBLIC_UMAMI_WEBSITE_ID` | `data-website-id` 中的 UUID |

Pages 工作流在构建时读取这些变量。代码合并推送后，手动运行 **Pages** 工作流或触发正常的 main 分支部署。只修改变量不会重建已部署的 HTML。两项都留空时不请求统计脚本；仅配置一项或配置无效时构建会报错。

本地验证时，把 `.env.example` 复制为 `.env.local`，填写两项参数，并设置 `PUBLIC_UMAMI_DOMAINS=127.0.0.1`，然后重启开发服务器。默认只允许生产域名采集，日常开发不要开启本地统计。在浏览器设置 `localStorage['umami.disabled'] = '1'` 可排除自己的访问，删除该值恢复采集；浏览器提供的 Do Not Track 信号也会被尊重。

## 验证数据与隐私过滤

接入使用 Umami v2.18+ 的 `data-before-send` 过滤接口和手动统计函数，未启用自动点击采集以及可选的性能/回放采集。每次页面加载发送一次页面访问，另采集以下显式动作：

| 事件 | 含义 |
| --- | --- |
| `demo_interact` | 主动消费一次，只记录允许或拒绝结果 |
| `demo_complete` | 同一演练页面观察到两种结果后，仅记录一次 |
| `install_copy` / `code_copy` / `share_copy` | 剪贴板写入成功 |
| `example_open` / `feedback_open` | 点击带标记的示例或反馈链接 |

事件只包含固定页面类型、语言及可选结果。页面路径来自构建产物，不取用户输入的路径；任意 query/hash、演练 `config`、key、记录、页面标题及来源路径均被移除，仅保留来源 origin。统计脚本请求使用 `no-referrer`。分享链接本身仍包含演练状态，请用虚构数据；托管平台处理请求 URL 的行为独立于此统计过滤。

营销参数在 `src/lib/analytics.ts` 中显式列入白名单。例如：

```text
https://sorayama.github.io/fatigue-kit/playground/?utm_source=juejin&utm_medium=community&utm_campaign=launch_2026q4&utm_content=coupon_v1
```

后续新活动标识需主动扩充白名单，站内导航不新增 UTM。复制命令、点击反馈链接或下载 npm 包都不能证明实际采用；通过自愿填写的 [使用反馈](https://github.com/SoraYama/fatigue-kit/issues/new?template=adoption-feedback.yml) 确认项目接入，并按可选许可在至少 14 天后随访。

部署后，在浏览器 DevTools Network 检查脚本成功加载、每页只有一次页面访问、复制和消费动作产生对应事件，并在 Umami 中看到结果。覆盖中英文首页、文档和演练场。用虚构分享配置检查发出的请求，确认没有 key 或记录。浏览器 mock 测试只能验证传输约定，不能证明你的 Umami 账号已收到生产数据。

无需账号即可运行配置后的浏览器测试，使用拦截的模拟统计脚本：

```sh
FATIGUE_TEST_ANALYTICS=1 npm run test:e2e --workspace @fatigue-kit/website -- --grep analytics
```

## 分享图片

`public/social-preview.png` 为 1280×640 分享卡片，旁边保留可编辑 SVG。独立页面与 Starlight 文档共用该图片。GitHub 仓库预览图需在仓库 **Settings → General → Social preview** 上传此 PNG；该设置独立于网站 OG 标签。
