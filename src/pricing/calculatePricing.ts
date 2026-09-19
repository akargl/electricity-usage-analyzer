import { DateTime } from 'luxon'
import type { Reading } from '../domain/types'
import type { PricingConfig, PricingResult, TariffRule } from './types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function resolvedZone(zone: string) {
  return zone === 'local' ? DateTime.local().zoneName : zone
}

function timeInMinutes(value: string) {
  const [hours = '0', minutes = '0'] = value.split(':')
  return Number(hours) * 60 + Number(minutes)
}

export function monthMatches(month: number, fromMonth: number, toMonth: number) {
  return fromMonth <= toMonth
    ? month >= fromMonth && month <= toMonth
    : month >= fromMonth || month <= toMonth
}

export function timeMatches(minutes: number, startTime: string, endTime: string) {
  const start = timeInMinutes(startTime)
  const end = timeInMinutes(endTime)
  if (start === end) return true
  return start < end
    ? minutes >= start && minutes < end
    : minutes >= start || minutes < end
}

export function ruleMatches(dateTime: DateTime, rule: TariffRule) {
  const minutes = dateTime.hour * 60 + dateTime.minute
  return monthMatches(dateTime.month, rule.fromMonth, rule.toMonth)
    && timeMatches(minutes, rule.startTime, rule.endTime)
}

export function tariffRuleLabel(rule: TariffRule) {
  const season = rule.fromMonth === rule.toMonth
    ? MONTHS[rule.fromMonth - 1]
    : `${MONTHS[rule.fromMonth - 1]}–${MONTHS[rule.toMonth - 1]}`
  return `${season} · ${rule.startTime}–${rule.endTime}`
}

function proratedBasePrice(firstTimestamp: number, lastTimestamp: number, zone: string, monthlyPrice: number) {
  let cursor = DateTime.fromMillis(firstTimestamp, { zone }).startOf('day')
  const end = DateTime.fromMillis(lastTimestamp, { zone }).startOf('day')
  let cost = 0
  let coveredDays = 0

  while (cursor <= end) {
    cost += monthlyPrice / (cursor.daysInMonth ?? 30)
    coveredDays += 1
    cursor = cursor.plus({ days: 1 })
  }

  return { cost, coveredDays }
}

export function calculatePricing(
  readings: Reading[],
  configuredZone: string,
  config: PricingConfig,
): PricingResult | null {
  if (readings.length === 0) return null

  const zone = resolvedZone(configuredZone)
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
  const allocations = new Map<string, { label: string; kwh: number; centsPerKwh: number; inputCost: number }>()
  let energyInputCost = 0

  for (const reading of sorted) {
    const dateTime = DateTime.fromMillis(reading.timestamp, { zone })
    const rule = config.rules.find((candidate) => ruleMatches(dateTime, candidate))
    const key = rule?.id ?? 'fallback'
    const centsPerKwh = Math.max(0, rule?.centsPerKwh ?? config.fallbackCentsPerKwh)
    const cost = reading.valueKwh * centsPerKwh / 100
    const current = allocations.get(key) ?? {
      label: rule ? tariffRuleLabel(rule) : 'All other times',
      kwh: 0,
      centsPerKwh,
      inputCost: 0,
    }
    current.kwh += reading.valueKwh
    current.inputCost += cost
    allocations.set(key, current)
    energyInputCost += cost
  }

  const base = proratedBasePrice(
    sorted[0].timestamp,
    sorted[sorted.length - 1].timestamp,
    zone,
    Math.max(0, config.basePricePerMonth),
  )
  const totalInputCost = energyInputCost + base.cost
  const taxRate = Math.max(0, config.taxPercent) / 100
  const netTotal = config.priceBasis === 'net' ? totalInputCost : totalInputCost / (1 + taxRate)
  const grossTotal = config.priceBasis === 'gross' ? totalInputCost : totalInputCost * (1 + taxRate)

  return {
    energyInputCost,
    baseInputCost: base.cost,
    totalInputCost,
    netTotal,
    taxAmount: grossTotal - netTotal,
    grossTotal,
    coveredDays: base.coveredDays,
    allocations: Array.from(allocations, ([key, allocation]) => ({ key, ...allocation })),
  }
}
