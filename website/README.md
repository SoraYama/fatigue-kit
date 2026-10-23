# fatigue-kit website

[简体中文](./README.zh-CN.md)

Astro/Starlight documentation and an in-browser rule Playground. The library packages contain no analytics. Website analytics is optional and disabled until both Umami configuration values are provided.

## Run and check

From the repository root:

```sh
npm run build
npm run build:react
npm run dev --workspace @fatigue-kit/website
npm test --workspace @fatigue-kit/website
npm run build:website
npm run test:server --workspace @fatigue-kit/website
npm run test:e2e --workspace @fatigue-kit/website
npm run lighthouse --workspace @fatigue-kit/website
```

## Set up Umami Cloud

1. [Create an Umami Cloud account](https://cloud.umami.is/signup). Google, GitHub and email signup are available; choose the service plan yourself.
2. In **Websites → Add website**, enter name `fatigue-kit` and domain `sorayama.me` (the current Pages redirect target; confirm the final hostname in your browser). Domain means the hostname, not `/fatigue-kit/`. [Official instructions](https://docs.umami.is/docs/add-a-website).
3. Edit the website and open **Tracking code**. Copy the script's `src` URL and `data-website-id` value. [Official instructions](https://docs.umami.is/docs/collect-data).
4. In this GitHub repository, go to **Settings → Secrets and variables → Actions → Variables** and create the two repository variables below. They are public tracker configuration, not API tokens or passwords.

| Variable | Value from your tracking code |
| --- | --- |
| `PUBLIC_UMAMI_SCRIPT_URL` | The full HTTPS `src` URL |
| `PUBLIC_UMAMI_WEBSITE_ID` | The `data-website-id` UUID |

The Pages workflow reads these variables at build time. Once the code is merged and pushed, run the **Pages** workflow or trigger a normal main-branch deployment. Changing a repository variable alone does not rebuild deployed HTML. If both variables are empty, no tracker is fetched; incomplete or invalid configuration fails the build.

For local verification, copy `.env.example` to `.env.local`, fill both values, and set `PUBLIC_UMAMI_DOMAINS=127.0.0.1`. Restart the dev server. The default allowed hosts are `sorayama.github.io` and its current redirect target `sorayama.me`; collection records the actual served hostname. Do not enable local collection for routine development. Set `localStorage['umami.disabled'] = '1'` in your browser to exclude your own visits; remove it to opt back in. An exposed Do Not Track signal is also respected.

## Verify collection and privacy

This integration uses Umami's `data-before-send` hook (v2.18+) and manual tracker functions. Automatic click tracking and optional performance/replay collection are not enabled. It sends one pageview per page load plus these explicit actions:

| Event | Meaning |
| --- | --- |
| `demo_interact` | An explicit consume attempt; only `allowed` or `denied` outcome |
| `demo_complete` | Both outcomes observed, once per loaded demo |
| `install_copy` / `code_copy` / `share_copy` | Clipboard write succeeded |
| `example_open` / `feedback_open` | A marked example or feedback link was opened |

Events include only the fixed page surface, locale and optional outcome. Page paths come from the built page, not URL input. Arbitrary query/hash values, Playground `config`, keys, records, page titles and referring paths are removed; the referring origin is retained. The tracker script request uses `no-referrer`. Shared URLs still contain the demo state: use fictional data before sharing, and remember that hosting providers can receive request URLs independently of analytics.

Campaign values are explicitly allowed in `src/lib/analytics.ts`. Example:

```text
https://sorayama.github.io/fatigue-kit/playground/?utm_source=juejin&utm_medium=community&utm_campaign=launch_2026q4&utm_content=coupon_v1
```

Add future campaign identifiers to the allowlist deliberately. Internal links do not add UTM parameters. A copied command, a feedback-link click and a package download do not establish real adoption; use voluntary [adoption feedback](https://github.com/SoraYama/fatigue-kit/issues/new?template=adoption-feedback.yml) for project-level confirmation and optional follow-up after 14 days.

After deployment, open DevTools Network and verify the tracker loads, exactly one pageview is sent, and copies/consume actions produce the expected events in Umami. Test home, docs and Playground in both languages. Inspect an outgoing request with a fictional shared configuration and confirm its key/record are absent. Mocked browser tests cover the transport contract; they do not prove your Umami account receives production data.

Run the configured browser tests with a mocked tracker, without an account or real data:

```sh
FATIGUE_TEST_ANALYTICS=1 npm run test:e2e --workspace @fatigue-kit/website -- --grep analytics
```

## Share images

`public/social-preview.png` is the 1280×640 social card, with editable SVG source beside it. Both standalone and Starlight pages reference the same image. To configure GitHub's repository preview, open repository **Settings → General → Social preview** and upload this PNG. This is a separate setting from website OG tags.
