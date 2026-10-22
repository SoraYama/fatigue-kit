import { createFatigue, memoryAdapter, type FatigueRule } from 'fatigue-kit'
import { useEffect, useMemo, useState } from 'react'

interface Props {
  locale?: 'en' | 'zh-CN'
  compact?: boolean
}

const copy = {
  en: {
    title: 'Run the rule, not a mock.',
    intro: 'Edit limits, advance time, and inspect results from the real engine.',
    consume: 'Try consume',
    peek: 'Peek',
    reset: 'Reset',
    advance: 'Advance 4 hours',
    share: 'Copy share link',
    copied: 'Link copied',
    allowed: 'Allowed',
    denied: 'Denied',
    remaining: 'remaining',
    time: 'simulated time',
    daily: 'daily maximum',
    weekly: '7-day maximum',
    cooldown: 'cooldown hours',
    record: 'record',
  },
  'zh-CN': {
    title: '直接运行真实规则。',
    intro: '编辑上限、推进时间，并查看真实引擎返回值。',
    consume: '尝试消费',
    peek: '只读检查',
    reset: '重置',
    advance: '前进 4 小时',
    share: '复制分享链接',
    copied: '链接已复制',
    allowed: '允许',
    denied: '拒绝',
    remaining: '剩余额度',
    time: '模拟时间',
    daily: '每日上限',
    weekly: '七日上限',
    cooldown: '冷却小时数',
    record: '当前记录',
  },
}

interface Configuration {
  dailyMax: number
  weeklyMax: number
  cooldownHours: number
  now: number
}

const initial: Configuration = {
  dailyMax: 1,
  weeklyMax: 3,
  cooldownHours: 4,
  now: Date.UTC(2026, 9, 22, 8),
}

function loadConfiguration(): Configuration {
  if (typeof window === 'undefined') return initial
  const encoded = new URLSearchParams(window.location.search).get('config')
  if (encoded === null) return initial
  try {
    const parsed = JSON.parse(atob(encoded)) as Partial<Configuration>
    return {
      dailyMax: positive(parsed.dailyMax, initial.dailyMax),
      weeklyMax: positive(parsed.weeklyMax, initial.weeklyMax),
      cooldownHours: positive(parsed.cooldownHours, initial.cooldownHours),
      now: typeof parsed.now === 'number' && Number.isFinite(parsed.now) ? parsed.now : initial.now,
    }
  } catch {
    return initial
  }
}

function positive(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

export default function Playground({ locale = 'en', compact = false }: Props) {
  const text = copy[locale]
  const [configuration, setConfiguration] = useState(initial)
  const [ready, setReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const clock = useMemo(() => ({ current: configuration.now, now: () => clock.current }), [])
  clock.current = configuration.now
  const fatigue = useMemo(() => createFatigue({ storage: memoryAdapter(), clock }), [clock])
  const rules = useMemo<FatigueRule[]>(
    () => [
      { max: configuration.dailyMax, every: 'day' },
      { max: configuration.weeklyMax, window: '7d' },
      { cooldown: `${configuration.cooldownHours}h` },
    ],
    [configuration.dailyMax, configuration.weeklyMax, configuration.cooldownHours],
  )
  const [result, setResult] = useState(() => fatigue.peek('coupon-popup', rules))

  useEffect(() => {
    setConfiguration(loadConfiguration())
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) setResult(fatigue.peek('coupon-popup', rules))
  }, [fatigue, ready, rules, configuration.now])

  function update(field: keyof Configuration, value: number) {
    setConfiguration((current) => ({ ...current, [field]: positive(value, current[field]) }))
  }

  function refresh(action: 'peek' | 'consume' | 'reset') {
    if (action === 'reset') {
      fatigue.reset('coupon-popup')
      setResult(fatigue.peek('coupon-popup', rules))
      return
    }
    setResult(
      action === 'consume'
        ? fatigue.tryConsume('coupon-popup', rules)
        : fatigue.peek('coupon-popup', rules),
    )
  }

  async function share() {
    const url = new URL(window.location.href)
    url.searchParams.set('config', btoa(JSON.stringify(configuration)))
    await navigator.clipboard.writeText(url.toString())
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className={`playground ${compact ? 'playground--compact' : ''}`}>
      <header>
        <p className="playground__status" aria-live="polite">
          {result.allowed ? text.allowed : text.denied}
        </p>
        <h2>{text.title}</h2>
        <p>{text.intro}</p>
      </header>
      {!compact && (
        <fieldset>
          <legend>Rules</legend>
          <label>{text.daily}<input type="number" min="1" value={configuration.dailyMax} onChange={(event) => update('dailyMax', event.currentTarget.valueAsNumber)} /></label>
          <label>{text.weekly}<input type="number" min="1" value={configuration.weeklyMax} onChange={(event) => update('weeklyMax', event.currentTarget.valueAsNumber)} /></label>
          <label>{text.cooldown}<input type="number" min="1" value={configuration.cooldownHours} onChange={(event) => update('cooldownHours', event.currentTarget.valueAsNumber)} /></label>
        </fieldset>
      )}
      <pre aria-label="Active frequency rules"><code>{JSON.stringify(rules, null, 2)}</code></pre>
      <dl>
        <div><dt>{text.remaining}</dt><dd>{String(result.remaining)}</dd></div>
        <div><dt>{text.time}</dt><dd>{new Date(configuration.now).toISOString()}</dd></div>
        {!compact && <div><dt>{text.record}</dt><dd>{JSON.stringify(fatigue.exportRecord('coupon-popup'))}</dd></div>}
      </dl>
      <div className="playground__actions">
        <button type="button" onClick={() => refresh('consume')}>{text.consume}</button>
        <button type="button" onClick={() => refresh('peek')}>{text.peek}</button>
        <button type="button" onClick={() => refresh('reset')}>{text.reset}</button>
        <button type="button" onClick={() => setConfiguration((current) => ({ ...current, now: current.now + 4 * 60 * 60 * 1000 }))}>{text.advance}</button>
        {!compact && <button type="button" onClick={share}>{copied ? text.copied : text.share}</button>}
      </div>
      <style>{`
        .playground { display: grid; gap: 1rem; }
        .playground h2 { margin: 0; font-size: clamp(1.6rem, 4vw, 2.4rem); }
        .playground header > p:last-child { color: var(--sl-color-gray-2); }
        .playground__status { color: var(--sl-color-accent); font: 700 .78rem var(--sl-font-mono); text-transform: uppercase; letter-spacing: .12em; }
        .playground fieldset { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; border: 1px solid var(--sl-color-gray-5); border-radius: .75rem; }
        .playground label { display: grid; gap: .35rem; color: var(--sl-color-gray-2); font-size: .8rem; }
        .playground input { min-width: 0; border: 1px solid var(--sl-color-gray-4); border-radius: .4rem; background: var(--sl-color-black); color: var(--sl-color-white); padding: .55rem; font: inherit; }
        .playground pre { margin: 0; border: 1px solid var(--sl-color-gray-5); border-radius: .75rem; padding: 1rem; overflow: auto; }
        .playground dl { display: grid; grid-template-columns: 1fr 2fr; gap: .75rem; margin: 0; }
        .playground dl div { border-top: 1px solid var(--sl-color-gray-5); padding-top: .75rem; }
        .playground dt { color: var(--sl-color-gray-3); font-size: .8rem; }
        .playground dd { margin: .25rem 0 0; font-family: var(--sl-font-mono); overflow-wrap: anywhere; }
        .playground__actions { display: flex; flex-wrap: wrap; gap: .5rem; }
        .playground button { border: 1px solid var(--sl-color-gray-4); border-radius: .5rem; background: var(--sl-color-gray-6); color: var(--sl-color-white); padding: .65rem .8rem; font: inherit; cursor: pointer; }
        .playground button:first-child { background: var(--sl-color-accent); color: var(--sl-color-black); border-color: var(--sl-color-accent); }
        .playground button:active { transform: translateY(1px); }
        @media (max-width: 35rem) { .playground dl, .playground fieldset { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}
