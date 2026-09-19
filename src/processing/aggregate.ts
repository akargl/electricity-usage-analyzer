import { DateTime } from 'luxon'
import type { AnalysisResult, DailyUsage, ProfilePoint, Reading } from '../domain/types'
import { mean, median } from './statistics'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function zoneName(zone: string) {
  return zone === 'local' ? DateTime.local().zoneName : zone
}

function inferIntervalMinutes(readings: Reading[]) {
  const timestamps = [...new Set(readings.map((reading) => reading.timestamp))].sort((a, b) => a - b)
  const differences: number[] = []

  for (let index = 1; index < timestamps.length; index += 1) {
    const minutes = (timestamps[index] - timestamps[index - 1]) / 60_000
    if (minutes > 0 && minutes <= 24 * 60) differences.push(minutes)
  }

  return median(differences)
}

function dateRange(firstDate: string, lastDate: string, zone: string) {
  const dates: string[] = []
  let cursor = DateTime.fromISO(firstDate, { zone })
  const end = DateTime.fromISO(lastDate, { zone })
  while (cursor <= end) {
    dates.push(cursor.toISODate()!)
    cursor = cursor.plus({ days: 1 })
  }
  return dates
}

function profilePoint(key: number, label: string, values: number[]): ProfilePoint {
  return {
    key,
    label,
    mean: mean(values),
    median: median(values),
    samples: values.length,
  }
}

export function aggregateReadings(readings: Reading[], configuredZone: string): AnalysisResult | null {
  if (readings.length === 0) return null

  const zone = zoneName(configuredZone)
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
  const interval = inferIntervalMinutes(sorted)
  const byDate = new Map<string, { total: number; count: number }>()
  const byDateHour = new Map<string, number>()

  for (const reading of sorted) {
    const dateTime = DateTime.fromMillis(reading.timestamp, { zone })
    const date = dateTime.toISODate()!
    const day = byDate.get(date) ?? { total: 0, count: 0 }
    day.total += reading.valueKwh
    day.count += 1
    byDate.set(date, day)

    const dateHour = `${date}|${dateTime.hour}`
    byDateHour.set(dateHour, (byDateHour.get(dateHour) ?? 0) + reading.valueKwh)
  }

  const firstDate = DateTime.fromMillis(sorted[0].timestamp, { zone }).toISODate()!
  const lastDate = DateTime.fromMillis(sorted[sorted.length - 1].timestamp, { zone }).toISODate()!
  const expectedPerDay = interval && interval < 24 * 60 ? Math.round((24 * 60) / interval) : null

  const daily: DailyUsage[] = dateRange(firstDate, lastDate, zone).map((date) => {
    const entry = byDate.get(date)
    if (!entry) return { date, value: null, readings: 0, coverage: 0, incomplete: true }
    const coverage = expectedPerDay ? Math.min(entry.count / expectedPerDay, 1) : null
    return {
      date,
      value: entry.total,
      readings: entry.count,
      coverage,
      incomplete: coverage !== null && coverage < 0.8,
    }
  })

  const weekdayValues = Array.from({ length: 7 }, () => [] as number[])
  for (const day of daily) {
    if (day.value === null) continue
    const weekday = DateTime.fromISO(day.date, { zone }).weekday - 1
    weekdayValues[weekday].push(day.value)
  }

  const hourlyValues = Array.from({ length: 24 }, () => [] as number[])
  for (const [key, value] of byDateHour) {
    const hour = Number(key.split('|')[1])
    hourlyValues[hour].push(value)
  }

  return {
    totalKwh: sorted.reduce((sum, reading) => sum + reading.valueKwh, 0),
    firstTimestamp: sorted[0].timestamp,
    lastTimestamp: sorted[sorted.length - 1].timestamp,
    validReadings: sorted.length,
    typicalIntervalMinutes: interval,
    daily,
    weekday: WEEKDAYS.map((label, index) => profilePoint(index + 1, label, weekdayValues[index])),
    hourly: Array.from({ length: 24 }, (_, hour) => profilePoint(hour, `${hour.toString().padStart(2, '0')}:00`, hourlyValues[hour])),
    hourlyAvailable: interval !== null && interval < 24 * 60,
    incompleteDays: daily.filter((day) => day.incomplete).length,
  }
}
