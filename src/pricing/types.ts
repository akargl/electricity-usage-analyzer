export type PriceBasis = 'net' | 'gross'

export interface TariffRule {
  id: string
  fromDate: string
  toDate: string
  startTime: string
  endTime: string
  centsPerKwh: number
}

export interface PricingConfig {
  basePricePerMonth: number
  fallbackCentsPerKwh: number
  priceBasis: PriceBasis
  taxPercent: number
  rules: TariffRule[]
}

export const defaultPricingConfig: PricingConfig = {
  basePricePerMonth: 0,
  fallbackCentsPerKwh: 13.9,
  priceBasis: 'net',
  taxPercent: 20,
  rules: [
    {
      id: 'winter-daytime',
      fromDate: '01.11',
      toDate: '30.04',
      startTime: '10:00',
      endTime: '16:00',
      centsPerKwh: 9.9,
    },
    {
      id: 'summer-daytime',
      fromDate: '01.05',
      toDate: '31.10',
      startTime: '10:00',
      endTime: '16:00',
      centsPerKwh: 4.99,
    },
  ],
}

export interface TariffAllocation {
  key: string
  label: string
  kwh: number
  centsPerKwh: number
  inputCost: number
}

export interface PricingResult {
  energyInputCost: number
  baseInputCost: number
  totalInputCost: number
  netTotal: number
  taxAmount: number
  grossTotal: number
  coveredDays: number
  allocations: TariffAllocation[]
}
