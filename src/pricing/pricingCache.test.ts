import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import type { Reading } from '../domain/types'
import { defaultPricingConfig } from './types'
import { createPricingResultCache } from './pricingCache'

const readings: Reading[] = [{
  timestamp: DateTime.fromISO('2026-08-03T18:00:00Z').toMillis(),
  valueKwh: 10,
  source: 'test.csv',
  row: 3,
}]

describe('pricing result cache', () => {
  it('reuses a calculation while the pricing configuration identity is unchanged', () => {
    const getResult = createPricingResultCache(readings, 'UTC')
    const first = getResult(defaultPricingConfig)
    const second = getResult(defaultPricingConfig)
    const changed = getResult({ ...defaultPricingConfig, fallbackCentsPerKwh: 20 })

    expect(second).toBe(first)
    expect(changed).not.toBe(first)
    expect(changed?.grossTotal).not.toBe(first?.grossTotal)
  })
})
