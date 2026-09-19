import { DateTime } from 'luxon'
import type { DecimalSeparator, TimestampFormat } from '../domain/types'

const AUTO_FORMATS: Exclude<TimestampFormat, 'auto' | 'iso'>[] = [
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd HH:mm',
  'dd.MM.yyyy HH:mm:ss',
  'dd.MM.yyyy HH:mm',
  'dd/MM/yyyy HH:mm',
  'MM/dd/yyyy HH:mm',
]

function resolvedZone(zone: string) {
  return zone === 'local' ? DateTime.local().zoneName : zone
}

export function parseTimestamp(
  raw: string,
  format: TimestampFormat,
  zone: string,
): number | null {
  const value = raw.trim()
  if (!value) return null

  const options = { zone: resolvedZone(zone), setZone: true }

  if (format === 'iso' || format === 'auto') {
    const iso = DateTime.fromISO(value, options)
    if (iso.isValid) return iso.toMillis()
  }

  const formats = format === 'auto' ? AUTO_FORMATS : [format]
  for (const candidate of formats) {
    const parsed = DateTime.fromFormat(value, candidate, options)
    if (parsed.isValid) return parsed.toMillis()
  }

  if (format === 'auto' && /^\d{10}(?:\d{3})?$/.test(value)) {
    const numeric = Number(value)
    const millis = value.length === 10 ? numeric * 1000 : numeric
    return Number.isFinite(millis) ? millis : null
  }

  return null
}

export function parseUsage(raw: string, separator: DecimalSeparator): number | null {
  let value = raw.trim().replace(/\s/g, '')
  if (!value) return null

  if (separator === 'comma') {
    value = value.replace(/\./g, '').replace(',', '.')
  } else if (separator === 'period') {
    value = value.replace(/,/g, '')
  } else {
    const comma = value.lastIndexOf(',')
    const period = value.lastIndexOf('.')
    if (comma >= 0 && period >= 0) {
      const decimal = comma > period ? ',' : '.'
      value = decimal === ','
        ? value.replace(/\./g, '').replace(',', '.')
        : value.replace(/,/g, '')
    } else if (comma >= 0) {
      value = value.replace(',', '.')
    }
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
