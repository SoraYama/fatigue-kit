import type { FatigueRecord, FatigueRule } from 'fatigue-kit'

export type CalendarPeriod = 'day' | 'week' | 'month' | 'year'

export interface PlaygroundConfiguration {
  version: 1
  key: string
  now: number
  calendarEnabled: boolean
  calendarMax: number
  calendarPeriod: CalendarPeriod
  cutoff: string
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  windowEnabled: boolean
  windowMax: number
  windowDays: number
  cooldownEnabled: boolean
  cooldownHours: number
  lifetimeEnabled: boolean
  lifetimeMax: number
  record: FatigueRecord | null
}

export const initialConfiguration: PlaygroundConfiguration = {
  version: 1,
  key: 'coupon-popup',
  now: Date.UTC(2026, 9, 22, 8),
  calendarEnabled: true,
  calendarMax: 1,
  calendarPeriod: 'day',
  cutoff: '00:00',
  weekStartsOn: 1,
  windowEnabled: true,
  windowMax: 3,
  windowDays: 7,
  cooldownEnabled: true,
  cooldownHours: 4,
  lifetimeEnabled: false,
  lifetimeMax: 5,
  record: null,
}

export function toRules(configuration: PlaygroundConfiguration): FatigueRule[] {
  const rules: FatigueRule[] = []
  if (configuration.calendarEnabled) {
    rules.push({
      max: configuration.calendarMax,
      every: configuration.calendarPeriod,
      cutoff: configuration.cutoff,
      weekStartsOn: configuration.weekStartsOn,
    })
  }
  if (configuration.windowEnabled) {
    rules.push({ max: configuration.windowMax, window: `${configuration.windowDays}d` })
  }
  if (configuration.cooldownEnabled) {
    rules.push({ cooldown: `${configuration.cooldownHours}h` })
  }
  if (configuration.lifetimeEnabled) rules.push({ max: configuration.lifetimeMax })
  return rules
}

export function encodeConfiguration(configuration: PlaygroundConfiguration): string {
  return toBase64Url(JSON.stringify(configuration))
}

export function decodeConfiguration(encoded: string | null): PlaygroundConfiguration {
  if (encoded === null) return initialConfiguration
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as Partial<PlaygroundConfiguration>
    if (parsed.version !== 1) return initialConfiguration
    return sanitize(parsed)
  } catch {
    return initialConfiguration
  }
}

export function generateCode(configuration: PlaygroundConfiguration): string {
  return `import { createFatigue } from 'fatigue-kit'

const fatigue = createFatigue()
const result = fatigue.tryConsume(${JSON.stringify(configuration.key)}, ${JSON.stringify(toRules(configuration), null, 2)})`
}

function sanitize(value: Partial<PlaygroundConfiguration>): PlaygroundConfiguration {
  const period: CalendarPeriod[] = ['day', 'week', 'month', 'year']
  return {
    version: 1,
    key: typeof value.key === 'string' && value.key.trim() !== '' ? value.key : initialConfiguration.key,
    now: finite(value.now, initialConfiguration.now),
    calendarEnabled: boolean(value.calendarEnabled, true),
    calendarMax: positive(value.calendarMax, 1),
    calendarPeriod: period.includes(value.calendarPeriod as CalendarPeriod)
      ? (value.calendarPeriod as CalendarPeriod)
      : 'day',
    cutoff: typeof value.cutoff === 'string' && /^\d{2}:\d{2}$/.test(value.cutoff) ? value.cutoff : '00:00',
    weekStartsOn: integerRange(value.weekStartsOn, 0, 6, 1) as PlaygroundConfiguration['weekStartsOn'],
    windowEnabled: boolean(value.windowEnabled, true),
    windowMax: positive(value.windowMax, 3),
    windowDays: positive(value.windowDays, 7),
    cooldownEnabled: boolean(value.cooldownEnabled, true),
    cooldownHours: positive(value.cooldownHours, 4),
    lifetimeEnabled: boolean(value.lifetimeEnabled, false),
    lifetimeMax: positive(value.lifetimeMax, 5),
    record: validRecord(value.record) ? value.record : null,
  }
}

function positive(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function boolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function integerRange(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback
}

function validRecord(value: unknown): value is FatigueRecord {
  if (value === null) return true
  if (typeof value !== 'object') return false
  const record = value as Partial<FatigueRecord>
  return (
    record.v === 1 &&
    Array.isArray(record.hits) &&
    record.hits.every((hit) => typeof hit === 'number' && Number.isFinite(hit)) &&
    typeof record.lifetime === 'number' &&
    Number.isFinite(record.lifetime)
  )
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
}
