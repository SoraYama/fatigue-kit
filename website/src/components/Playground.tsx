import { createFatigue, memoryAdapter, type ConsumeResult } from 'fatigue-kit'
import { useEffect, useMemo, useState } from 'react'
import {
  decodeConfiguration,
  encodeConfiguration,
  generateCode,
  formatLocalDateTime,
  normalizeConfiguration,
  initialConfiguration,
  type PlaygroundConfiguration,
  toRules,
} from '../lib/playground'

interface Props {
  locale?: 'en' | 'zh-CN'
  compact?: boolean
}

const copy = {
  en: {
    preview: 'Coupon preview', close: 'Close coupon', previewText: 'This coupon appears only after an allowed attempt.', copyCode: 'Copy Web code', codeCopied: 'Code copied', copyFailed: 'Clipboard unavailable. Copy the link or code below.', shareLink: 'Share link', nextStep: 'Advance to next available', memory: 'This demo uses memory and simulated time. The generated Web code uses localStorage and your device clock.', title: 'Run the real engine.', intro: 'Compose every v1 rule, move time, and share a reproducible state.', rules: 'Rules', result: 'Result', key: 'Key', calendar: 'Calendar limit', period: 'Period', maximum: 'Maximum', cutoff: 'Business-day cutoff', weekStarts: 'Week starts on', window: 'Sliding window', days: 'Window days', cooldown: 'Cooldown', hours: 'Hours', lifetime: 'Lifetime limit', consume: 'Try consume', peek: 'Peek', reset: 'Reset', advance: 'Advance 4 hours', share: 'Copy share link', copied: 'Link copied', allowed: 'Allowed', denied: 'Denied', remaining: 'Remaining', next: 'Next available', deniedBy: 'Denied by', time: 'Simulated time', setTime: 'Set time', record: 'Record JSON', import: 'Import record', export: 'Export record', invalid: 'Invalid record JSON', code: 'Generated TypeScript', privacy: 'Everything runs locally in your browser. Shared URLs may contain the key and record.', enabled: 'Enabled', sunday: 'Sunday', monday: 'Monday',
  },
  'zh-CN': {
    preview: '优惠预览', close: '关闭优惠', previewText: '只有本次消费被允许，优惠才会展示。', copyCode: '复制 Web 代码', codeCopied: '代码已复制', copyFailed: '剪贴板不可用，请手动复制下方链接或代码。', shareLink: '分享链接', nextStep: '前进到下次可用时间', memory: '演练使用内存和模拟时钟；生成的 Web 代码使用 localStorage 和设备时钟。', title: '运行真实引擎。', intro: '组合全部 v1 规则、推进时间并分享可复现状态。', rules: '规则', result: '结果', key: 'Key', calendar: '日历周期上限', period: '周期', maximum: '最大次数', cutoff: '业务日界线', weekStarts: '每周起始日', window: '滑动窗口', days: '窗口天数', cooldown: '冷却时间', hours: '小时', lifetime: '终身上限', consume: '尝试消费', peek: '只读检查', reset: '重置', advance: '前进 4 小时', share: '复制分享链接', copied: '链接已复制', allowed: '允许', denied: '拒绝', remaining: '剩余额度', next: '下次可用', deniedBy: '拒绝规则', time: '模拟时间', setTime: '设置时间', record: '记录 JSON', import: '导入记录', export: '导出记录', invalid: '记录 JSON 无效', code: '生成的 TypeScript', privacy: '所有操作均在浏览器本地完成。分享链接可能包含 key 和记录。', enabled: '启用', sunday: '星期日', monday: '星期一',
  },
}

export default function Playground({ locale = 'en', compact = false }: Props) {
  const text = copy[locale]
  const [configuration, setConfiguration] = useState(initialConfiguration)
  const [ready, setReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [couponOpen, setCouponOpen] = useState(false)
  const [recordText, setRecordText] = useState('null')
  const [recordError, setRecordError] = useState('')
  const clock = useMemo(() => ({ current: configuration.now, now: () => clock.current }), [])
  clock.current = configuration.now
  const fatigue = useMemo(() => createFatigue({ storage: memoryAdapter(), clock }), [clock])
  const rules = useMemo(() => toRules(configuration), [configuration])
  const [result, setResult] = useState<ConsumeResult>(() => fatigue.peek(configuration.key, rules))

  useEffect(() => {
    const loaded = decodeConfiguration(new URLSearchParams(window.location.search).get('config'))
    setConfiguration(loaded)
    if (loaded.record !== null) fatigue.importRecord(loaded.key, loaded.record)
    setRecordText(JSON.stringify(loaded.record, null, 2))
    setReady(true)
  }, [fatigue])

  useEffect(() => {
    if (ready) setResult(fatigue.peek(configuration.key, rules))
  }, [fatigue, configuration, ready, rules])

  function update<K extends keyof PlaygroundConfiguration>(field: K, value: PlaygroundConfiguration[K]) {
    setConfiguration((current) => normalizeConfiguration({ ...current, [field]: value }))
  }

  function refresh(action: 'peek' | 'consume' | 'reset') {
    if (action === 'reset') fatigue.reset(configuration.key)
    const next = action === 'consume'
      ? fatigue.tryConsume(configuration.key, rules)
      : fatigue.peek(configuration.key, rules)
    setResult(next)
    if (action === 'consume') setCouponOpen(next.allowed)
    if (action === 'reset') setCouponOpen(false)
    const record = fatigue.exportRecord(configuration.key)
    setRecordText(JSON.stringify(record, null, 2))
    setConfiguration((current) => ({ ...current, record }))
  }

  function importRecord() {
    try {
      const parsed = JSON.parse(recordText) as PlaygroundConfiguration['record']
      if (parsed === null) fatigue.reset(configuration.key)
      else fatigue.importRecord(configuration.key, parsed)
      setRecordError('')
      setConfiguration((current) => ({ ...current, record: fatigue.exportRecord(current.key) }))
      setResult(fatigue.peek(configuration.key, rules))
    } catch {
      setRecordError(text.invalid)
    }
  }

  async function share() {
    if (!ready) return
    const url = new URL(window.location.pathname, window.location.origin)
    url.searchParams.set('config', encodeConfiguration({ ...configuration, record: fatigue.exportRecord(configuration.key) }))
    setShareUrl(url.toString())
    setCopied(false)
    setCopyError('')
    try {
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopyError(text.copyFailed)
    }
  }

  async function copyCode() {
    setCodeCopied(false)
    setCopyError('')
    try {
      await navigator.clipboard.writeText(generateCode(configuration))
      setCodeCopied(true)
      window.setTimeout(() => setCodeCopied(false), 1500)
    } catch {
      setCopyError(text.copyFailed)
    }
  }

  const number = (field: keyof PlaygroundConfiguration) => (event: React.ChangeEvent<HTMLInputElement>) =>
    update(field, event.currentTarget.valueAsNumber as never)
  const toggle = (field: keyof PlaygroundConfiguration) => (event: React.ChangeEvent<HTMLInputElement>) =>
    update(field, event.currentTarget.checked as never)

  return (
    <section className={`playground ${compact ? 'playground--compact' : ''}`} data-ready={ready}>
      <header><p className="playground__status" aria-live="polite">{result.allowed ? text.allowed : text.denied}</p><h2>{text.title}</h2><p>{text.intro}</p><p>{text.memory}</p></header>
      {!compact && <div className="playground__builder">
        <fieldset><legend>{text.rules}</legend>
          <label>{text.key}<input value={configuration.key} onChange={(event) => update('key', event.currentTarget.value)} /></label>
          <RuleToggle label={text.calendar} checked={configuration.calendarEnabled} onChange={toggle('calendarEnabled')} />
          {configuration.calendarEnabled && <div className="rule-row"><label>{text.maximum}<input type="number" min="1" value={configuration.calendarMax} onChange={number('calendarMax')} /></label><label>{text.period}<select value={configuration.calendarPeriod} onChange={(event) => update('calendarPeriod', event.currentTarget.value as PlaygroundConfiguration['calendarPeriod'])}><option value="day">day</option><option value="week">week</option><option value="month">month</option><option value="year">year</option></select></label><label>{text.cutoff}<input type="time" value={configuration.cutoff} onChange={(event) => update('cutoff', event.currentTarget.value)} /></label><label>{text.weekStarts}<select value={configuration.weekStartsOn} onChange={(event) => update('weekStartsOn', Number(event.currentTarget.value) as PlaygroundConfiguration['weekStartsOn'])}><option value="0">{text.sunday}</option><option value="1">{text.monday}</option></select></label></div>}
          <RuleToggle label={text.window} checked={configuration.windowEnabled} onChange={toggle('windowEnabled')} />
          {configuration.windowEnabled && <div className="rule-row"><label>{text.maximum}<input type="number" min="1" value={configuration.windowMax} onChange={number('windowMax')} /></label><label>{text.days}<input type="number" min="1" value={configuration.windowDays} onChange={number('windowDays')} /></label></div>}
          <RuleToggle label={text.cooldown} checked={configuration.cooldownEnabled} onChange={toggle('cooldownEnabled')} />
          {configuration.cooldownEnabled && <label>{text.hours}<input type="number" min="1" value={configuration.cooldownHours} onChange={number('cooldownHours')} /></label>}
          <RuleToggle label={text.lifetime} checked={configuration.lifetimeEnabled} onChange={toggle('lifetimeEnabled')} />
          {configuration.lifetimeEnabled && <label>{text.maximum}<input type="number" min="1" value={configuration.lifetimeMax} onChange={number('lifetimeMax')} /></label>}
        </fieldset>
      </div>}
      {couponOpen && <section className="playground__coupon" aria-label={text.preview}><h3>{text.preview}</h3><p>{text.previewText}</p><button type="button" onClick={() => setCouponOpen(false)}>{text.close}</button></section>}
      <pre tabIndex={0} aria-label="Active frequency rules"><code>{JSON.stringify(rules, null, 2)}</code></pre>
      <dl><div><dt>{text.remaining}</dt><dd>{String(result.remaining)}</dd></div><div><dt>{text.time}</dt><dd>{new Date(configuration.now).toISOString()}</dd></div>{result.nextAvailableAt !== undefined && <div><dt>{text.next}</dt><dd>{new Date(result.nextAvailableAt).toISOString()}</dd></div>}{result.deniedBy !== undefined && <div><dt>{text.deniedBy}</dt><dd>{JSON.stringify(result.deniedBy)}</dd></div>}</dl>
      <div className="playground__actions"><button type="button" disabled={!ready} onClick={() => refresh('consume')}>{text.consume}</button><button type="button" onClick={() => refresh('peek')}>{text.peek}</button><button type="button" onClick={() => refresh('reset')}>{text.reset}</button><button type="button" onClick={() => update('now', configuration.now + 4 * 60 * 60 * 1000)}>{text.advance}</button>{result.nextAvailableAt !== undefined && Number.isFinite(result.nextAvailableAt) && <button type="button" onClick={() => update('now', result.nextAvailableAt!)}>{text.nextStep}</button>}{!compact && <button type="button" onClick={share}>{copied ? text.copied : text.share}</button>}</div>
      {!compact && <><label>{text.setTime}<input type="datetime-local" value={formatLocalDateTime(configuration.now)} onChange={(event) => update('now', new Date(event.currentTarget.value).getTime())} /></label><label>{text.record}<textarea rows={6} value={recordText} onChange={(event) => setRecordText(event.currentTarget.value)} aria-describedby="record-error" /></label><p id="record-error" role="alert">{recordError}</p><button type="button" onClick={importRecord}>{text.import}</button><h3>{text.code}</h3><pre tabIndex={0} aria-label={text.code}><code>{generateCode(configuration)}</code></pre><button type="button" onClick={copyCode}>{codeCopied ? text.codeCopied : text.copyCode}</button><p role="status">{copyError}</p>{copyError && shareUrl && <label>{text.shareLink}<input readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></label>}<p className="playground__privacy">{text.privacy}</p></>}
      <style>{styles}</style>
    </section>
  )
}

function RuleToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: React.ChangeEventHandler<HTMLInputElement> }) {
  return <label className="rule-toggle"><input type="checkbox" checked={checked} onChange={onChange} />{label}</label>
}

const styles = `.playground{display:grid;gap:1rem}.playground__coupon{padding:1rem;border:2px solid var(--sl-color-accent);border-radius:.75rem;background:var(--sl-color-gray-6)}.playground__coupon h3{margin:0}.playground button:disabled{opacity:.5;cursor:wait}.playground h2{margin:0;font-size:clamp(1.6rem,4vw,2.4rem)}.playground header>p:last-child,.playground__privacy{color:var(--sl-color-gray-2)}.playground__status{color:var(--sl-color-accent);font:700 .78rem var(--sl-font-mono);text-transform:uppercase;letter-spacing:.12em}.playground fieldset{display:grid;gap:.85rem;border:1px solid var(--sl-color-gray-5);border-radius:.75rem}.rule-row{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem}.playground label{display:grid;gap:.35rem;color:var(--sl-color-gray-2);font-size:.8rem}.rule-toggle{display:flex!important;align-items:center;gap:.5rem!important;color:var(--sl-color-white)!important;font-weight:650}.playground input,.playground select,.playground textarea{min-width:0;border:1px solid var(--sl-color-gray-4);border-radius:.4rem;background:var(--sl-color-black);color:var(--sl-color-white);padding:.55rem;font:inherit}.playground pre{margin:0;border:1px solid var(--sl-color-gray-5);border-radius:.75rem;padding:1rem;overflow:auto}.playground dl{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;margin:0}.playground dl div{border-top:1px solid var(--sl-color-gray-5);padding-top:.75rem}.playground dt{color:var(--sl-color-gray-3);font-size:.8rem}.playground dd{margin:.25rem 0 0;font-family:var(--sl-font-mono);overflow-wrap:anywhere}.playground__actions{display:flex;flex-wrap:wrap;gap:.5rem}.playground button{border:1px solid var(--sl-color-gray-4);border-radius:.5rem;background:var(--sl-color-gray-6);color:var(--sl-color-white);padding:.65rem .8rem;font:inherit;cursor:pointer}.playground button:first-child{background:var(--sl-color-accent);color:var(--sl-color-black);border-color:var(--sl-color-accent)}.playground button:active{transform:translateY(1px)}.playground button:focus-visible,.playground input:focus-visible,.playground select:focus-visible,.playground textarea:focus-visible{outline:3px solid var(--sl-color-accent);outline-offset:2px}@media(max-width:48rem){.rule-row,.playground dl{grid-template-columns:1fr}}`
