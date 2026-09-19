import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import { parseTimestamp, parseUsage } from './parsers'

describe('parseUsage', () => {
  it('parses decimal comma and period values', () => {
    expect(parseUsage('12,45', 'auto')).toBe(12.45)
    expect(parseUsage('12.45', 'auto')).toBe(12.45)
    expect(parseUsage('1.234,56', 'comma')).toBe(1234.56)
    expect(parseUsage('1,234.56', 'period')).toBe(1234.56)
  })

  it('returns null for missing and non-numeric values', () => {
    expect(parseUsage(' ', 'auto')).toBeNull()
    expect(parseUsage('not a number', 'auto')).toBeNull()
  })
})

describe('parseTimestamp', () => {
  it('detects common European timestamps', () => {
    const result = parseTimestamp('03.08.2026 14:15', 'auto', 'UTC')
    expect(result).toBe(DateTime.fromISO('2026-08-03T14:15:00Z').toMillis())
  })

  it('uses an explicit US format without ambiguity', () => {
    const result = parseTimestamp('08/03/2026 14:15', 'MM/dd/yyyy HH:mm', 'UTC')
    expect(result).toBe(DateTime.fromISO('2026-08-03T14:15:00Z').toMillis())
  })

  it('rejects invalid timestamps', () => {
    expect(parseTimestamp('yesterday-ish', 'auto', 'UTC')).toBeNull()
  })
})
