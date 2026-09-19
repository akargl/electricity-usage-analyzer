import { describe, expect, it } from 'vitest'
import { tooltipKwh } from '../shared/formatters'

describe('chart tooltip formatting', () => {
  it('formats numeric usage values instead of treating axis data as missing', () => {
    expect(tooltipKwh(14.22)).toBe('14.22 kWh')
  })

  it('keeps the missing-reading label for null data gaps', () => {
    expect(tooltipKwh(null)).toBe('No reading')
  })
})
