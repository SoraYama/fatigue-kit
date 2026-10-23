const eventNames = ['demo_interact', 'demo_complete', 'code_copy', 'install_copy', 'share_copy', 'example_open', 'feedback_open'] as const
type SiteEvent = typeof eventNames[number]

const campaigns: Record<string, readonly string[]> = {
  utm_source: ['juejin', 'v2ex', 'hackernews', 'reddit', 'devto', 'github', 'wechat', 'zhihu'],
  utm_medium: ['community', 'article', 'social', 'referral'],
  utm_campaign: ['launch_2026q4'],
  utm_content: ['coupon_v1', 'react_v1', 'readme', 'sidebar', 'footer'],
}

interface AnalyticsContext {
  websiteId: string
  path: string
  origin: string
}

interface RuntimeConfiguration extends AnalyticsContext {
  scriptUrl: string
  domains: string[]
}

declare global {
  interface Window {
    umami?: { track: (name?: string, data?: Record<string, string>) => unknown }
    fatigueAnalyticsEnabled?: boolean
    fatigueBeforeSend?: (type: string, payload: unknown) => unknown
  }
}

export function resolveAnalyticsConfiguration(scriptUrl = '', websiteId = '') {
  if (!scriptUrl && !websiteId) return null
  let url: URL
  try {
    url = new URL(scriptUrl)
  } catch {
    throw new Error('[fatigue-kit/website] Set both PUBLIC_UMAMI_SCRIPT_URL and PUBLIC_UMAMI_WEBSITE_ID.')
  }
  if (url.protocol !== 'https:' || url.username || url.password || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(websiteId)) {
    throw new Error('[fatigue-kit/website] Analytics requires an HTTPS script URL without credentials and a valid Website ID.')
  }
  return { scriptUrl: url.href, websiteId }
}

export function sanitizeAnalyticsPayload(type: string, raw: unknown, context: AnalyticsContext) {
  if (type !== 'event' || !raw || typeof raw !== 'object') return false
  const input = raw as Record<string, unknown>
  if (input.name !== undefined && !eventNames.includes(input.name as SiteEvent)) return false
  const url = new URL(context.path, context.origin)
  try {
    const incoming = new URL(String(input.url ?? ''), context.origin)
    for (const [key, values] of Object.entries(campaigns)) {
      const value = incoming.searchParams.get(key)
      if (value && values.includes(value)) url.searchParams.set(key, value)
    }
  } catch { /* Invalid input contributes no campaign tags. */ }
  let referrer = ''
  try {
    const incoming = new URL(String(input.referrer ?? ''))
    if (['http:', 'https:'].includes(incoming.protocol)) referrer = incoming.origin
  } catch { /* No usable referring origin. */ }
  const locale = context.path.includes('/zh-cn/') ? 'zh-CN' : 'en'
  const surface = context.path.includes('/docs/') ? 'docs' : context.path.includes('/playground/') ? 'playground' : 'home'
  const data: Record<string, string> = { surface, locale }
  if (input.data && typeof input.data === 'object') {
    const outcome = (input.data as Record<string, unknown>).outcome
    if (outcome === 'allowed' || outcome === 'denied') data.outcome = outcome
  }
  return {
    website: context.websiteId,
    hostname: new URL(context.origin).hostname,
    url: `${url.pathname}${url.search}`,
    referrer,
    title: 'fatigue-kit',
    language: locale,
    ...(input.name === undefined ? {} : { name: input.name as SiteEvent, data }),
  }
}

export function trackSiteEvent(name: SiteEvent, data?: { outcome: 'allowed' | 'denied' }) {
  if (typeof window === 'undefined' || !window.fatigueAnalyticsEnabled || !eventNames.includes(name)) return
  try {
    void Promise.resolve(window.umami?.track(name, data)).catch(() => {})
  } catch { /* Analytics must never interrupt a display or clipboard action. */ }
}

export function initializeAnalytics() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="fatigue-analytics"]')
  if (!meta || document.getElementById('fatigue-umami') || navigator.doNotTrack === '1') return
  let config: RuntimeConfiguration
  try {
    config = JSON.parse(meta.content) as RuntimeConfiguration
    if (!config.domains.includes(window.location.hostname)) return
    if (localStorage.getItem('umami.disabled') === '1') return
  } catch { return }

  // Install the filter before fetching the tracker; it applies to every send.
  window.fatigueBeforeSend = (type, payload) => sanitizeAnalyticsPayload(type, payload, config)
  const script = document.createElement('script')
  script.id = 'fatigue-umami'
  script.src = config.scriptUrl
  script.async = true
  script.referrerPolicy = 'no-referrer'
  script.dataset.websiteId = config.websiteId
  script.dataset.autoTrack = 'false'
  script.dataset.beforeSend = 'fatigueBeforeSend'
  script.dataset.excludeHash = 'true'
  script.dataset.doNotTrack = 'true'
  script.addEventListener('load', () => {
    if (!window.umami?.track) return
    window.fatigueAnalyticsEnabled = true
    try {
      void Promise.resolve(window.umami.track()).catch(() => {})
    } catch { /* Ignore unavailable analytics backends. */ }
  })
  document.head.append(script)
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-analytics-event]') : null
    const name = target?.dataset.analyticsEvent
    if (name && eventNames.includes(name as SiteEvent)) trackSiteEvent(name as SiteEvent)
  })
}
