import type { Reading } from '../domain/types'
import { calculatePricing } from './calculatePricing'
import type { PricingConfig, PricingResult } from './types'

export function createPricingResultCache(readings: Reading[], timeZone: string) {
  const cache = new WeakMap<PricingConfig, PricingResult | null>()

  return (config: PricingConfig) => {
    if (cache.has(config)) return cache.get(config) ?? null
    const result = calculatePricing(readings, timeZone, config)
    cache.set(config, result)
    return result
  }
}
