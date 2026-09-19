import { describe, expect, it } from 'vitest'
import { mean, median } from './statistics'

describe('statistics', () => {
  it('calculates mean and median', () => {
    expect(mean([1, 2, 9])).toBe(4)
    expect(median([9, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('returns null for empty samples', () => {
    expect(mean([])).toBeNull()
    expect(median([])).toBeNull()
  })
})
