import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import type { Reading } from '../domain/types'
import { aggregateReadings } from './aggregate'

function reading(iso: string, valueKwh: number): Reading {
  return { timestamp: DateTime.fromISO(iso, { zone: 'UTC' }).toMillis(), valueKwh, source: 'test.csv', row: 1 }
}

describe('aggregateReadings', () => {
  it('produces daily totals and weekday statistics', () => {
    const result = aggregateReadings([
      reading('2026-08-03T00:00:00Z', 1),
      reading('2026-08-03T12:00:00Z', 2),
      reading('2026-08-04T00:00:00Z', 3),
      reading('2026-08-04T12:00:00Z', 5),
    ], 'UTC')!

    expect(result.totalKwh).toBe(11)
    expect(result.daily.map((day) => day.value)).toEqual([3, 8])
    expect(result.weekday[0].mean).toBe(3)
    expect(result.weekday[1].median).toBe(8)
    expect(result.typicalIntervalMinutes).toBe(720)
  })

  it('represents entirely missing dates as gaps', () => {
    const result = aggregateReadings([
      reading('2026-08-03T00:00:00Z', 1),
      reading('2026-08-05T00:00:00Z', 2),
    ], 'UTC')!

    expect(result.daily).toHaveLength(3)
    expect(result.daily[1]).toMatchObject({ date: '2026-08-04', value: null, incomplete: true })
  })

  it('disables the hourly profile for daily readings', () => {
    const result = aggregateReadings([
      reading('2026-08-03T00:00:00Z', 2),
      reading('2026-08-04T00:00:00Z', 3),
      reading('2026-08-05T00:00:00Z', 4),
    ], 'UTC')!

    expect(result.hourlyAvailable).toBe(false)
  })
})
