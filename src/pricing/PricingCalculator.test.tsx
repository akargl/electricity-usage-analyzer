import { DateTime } from 'luxon'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { Reading } from '../domain/types'
import { PricingCalculator } from './PricingCalculator'
import { createDefaultTariffPlan, type TariffPlan } from './types'

const readings: Reading[] = [{
  timestamp: DateTime.fromISO('2026-08-03T18:00:00Z').toMillis(),
  valueKwh: 10,
  source: 'test.csv',
  row: 3,
}]

function PricingCalculatorHarness() {
  const [tariffs, setTariffs] = useState<TariffPlan[]>(() => [createDefaultTariffPlan()])
  const [selectedTariffId, setSelectedTariffId] = useState('tariff-1')
  const [visible, setVisible] = useState(true)

  return (
    <>
      <button type="button" onClick={() => setVisible((current) => !current)}>Toggle calculator</button>
      {visible && (
        <PricingCalculator
          readings={readings}
          timeZone="UTC"
          tariffs={tariffs}
          setTariffs={setTariffs}
          selectedTariffId={selectedTariffId}
          setSelectedTariffId={setSelectedTariffId}
        />
      )}
    </>
  )
}

describe('PricingCalculator tariff comparison', () => {
  it('adds, names, compares, selects, and removes independent tariffs', () => {
    render(<PricingCalculatorHarness />)

    fireEvent.click(screen.getByRole('button', { name: /add tariff/i }))
    expect(screen.getByRole('button', { name: /tariff 2/i })).toBeInTheDocument()

    const nameInput = screen.getByLabelText('Tariff name')
    fireEvent.change(nameInput, { target: { value: 'Green plan' } })
    expect(nameInput).toHaveValue('Green plan')
    expect(screen.queryByRole('button', { name: /green plan/i })).not.toBeInTheDocument()
    fireEvent.blur(nameInput)
    fireEvent.change(screen.getByLabelText('Fallback cents per kilowatt-hour'), { target: { value: '20' } })

    expect(screen.getByRole('button', { name: /green plan/i })).toBeInTheDocument()
    expect(screen.getAllByText('Best price')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle calculator' }))
    fireEvent.click(screen.getByRole('button', { name: 'Toggle calculator' }))
    expect(screen.getByRole('button', { name: /green plan/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Fallback cents per kilowatt-hour')).toHaveValue(20)

    fireEvent.click(screen.getByRole('button', { name: /tariff 1/i }))
    expect(screen.getByLabelText('Tariff name')).toHaveValue('Tariff 1')

    fireEvent.click(screen.getByRole('button', { name: /green plan/i }))
    fireEvent.click(screen.getByRole('button', { name: /remove tariff/i }))
    expect(screen.queryByRole('button', { name: /green plan/i })).not.toBeInTheDocument()
  })
})
