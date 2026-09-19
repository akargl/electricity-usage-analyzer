import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import type { Reading } from '../domain/types'
import { calculatePricing, monthMatches, timeMatches } from './calculatePricing'
import type { PricingConfig } from './types'

const config: PricingConfig = {
  basePricePerMonth: 31,
  fallbackCentsPerKwh: 13.9,
  priceBasis: 'net',
  taxPercent: 20,
  rules: [
    { id: 'winter', fromMonth: 11, toMonth: 4, startTime: '10:00', endTime: '16:00', centsPerKwh: 9.9 },
    { id: 'summer', fromMonth: 5, toMonth: 10, startTime: '10:00', endTime: '16:00', centsPerKwh: 4.99 },
  ],
}

function reading(iso: string, valueKwh: number): Reading {
  return { timestamp: DateTime.fromISO(iso, { zone: 'UTC' }).toMillis(), valueKwh, source: 'test.csv', row: 1 }
}

describe('tariff matching', () => {
  it('supports seasons that wrap across the end of the year', () => {
    expect(monthMatches(12, 11, 4)).toBe(true)
    expect(monthMatches(2, 11, 4)).toBe(true)
    expect(monthMatches(7, 11, 4)).toBe(false)
  })

  it('supports ordinary and overnight time bands', () => {
    expect(timeMatches(10 * 60, '10:00', '16:00')).toBe(true)
    expect(timeMatches(16 * 60, '10:00', '16:00')).toBe(false)
    expect(timeMatches(23 * 60, '22:00', '06:00')).toBe(true)
    expect(timeMatches(3 * 60, '22:00', '06:00')).toBe(true)
  })
})

describe('calculatePricing', () => {
  it('uses seasonal prices, fallback prices, prorated base price, and tax', () => {
    const result = calculatePricing([
      reading('2026-08-01T10:00:00Z', 10),
      reading('2026-08-01T18:00:00Z', 10),
    ], 'UTC', config)!

    expect(result.energyInputCost).toBeCloseTo(1.889)
    expect(result.baseInputCost).toBeCloseTo(1)
    expect(result.netTotal).toBeCloseTo(2.889)
    expect(result.taxAmount).toBeCloseTo(0.5778)
    expect(result.grossTotal).toBeCloseTo(3.4668)
    expect(result.allocations.map((allocation) => allocation.key)).toEqual(['summer', 'fallback'])
  })

  it('derives net and tax when entered prices already include tax', () => {
    const grossConfig = { ...config, basePricePerMonth: 0, rules: [], fallbackCentsPerKwh: 12, priceBasis: 'gross' as const }
    const result = calculatePricing([reading('2026-08-01T10:00:00Z', 10)], 'UTC', grossConfig)!

    expect(result.grossTotal).toBeCloseTo(1.2)
    expect(result.netTotal).toBeCloseTo(1)
    expect(result.taxAmount).toBeCloseTo(0.2)
  })
})
