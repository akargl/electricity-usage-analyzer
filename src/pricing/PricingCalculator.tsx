import { Calculator, CirclePlus, Info, ReceiptText, ShieldCheck, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Reading } from '../domain/types'
import { numberFormat } from '../shared/formatters'
import { calculatePricing, parseRecurringDate } from './calculatePricing'
import { defaultPricingConfig, type PricingConfig, type TariffRule } from './types'

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

interface Props {
  readings: Reading[]
  timeZone: string
}

function nextRuleId() {
  return `rate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function PricingCalculator({ readings, timeZone }: Props) {
  const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig)
  const result = useMemo(() => calculatePricing(readings, timeZone, config), [readings, timeZone, config])

  function update<K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  function updateRule<K extends keyof TariffRule>(id: string, key: K, value: TariffRule[K]) {
    setConfig((current) => ({
      ...current,
      rules: current.rules.map((rule) => rule.id === id ? { ...rule, [key]: value } : rule),
    }))
  }

  function addRule() {
    update('rules', [
      ...config.rules,
      { id: nextRuleId(), fromDate: '01.01', toDate: '31.12', startTime: '00:00', endTime: '00:00', centsPerKwh: 10 },
    ])
  }

  function removeRule(id: string) {
    update('rules', config.rules.filter((rule) => rule.id !== id))
  }

  if (!result) return null

  const maxAllocation = Math.max(...result.allocations.map((allocation) => allocation.kwh), 1)
  const basisLabel = config.priceBasis === 'net' ? 'net' : 'gross'

  return (
    <section className="pricing-section" aria-labelledby="pricing-title">
      <div className="pricing-heading">
        <div className="pricing-title-wrap">
          <span className="pricing-heading-icon"><Calculator size={21} /></span>
          <div>
            <span className="section-kicker">04 · Cost estimate</span>
            <h2 id="pricing-title">Energy price calculator</h2>
            <p>Apply your tariff to every valid reading without sending data anywhere.</p>
          </div>
        </div>
        <span className="local-calc-badge"><ShieldCheck size={14} /> Calculated locally</span>
      </div>

      <div className="pricing-layout">
        <form className="pricing-form" onSubmit={(event) => event.preventDefault()}>
          <div className="pricing-form-intro">
            <div><h3>Tariff details</h3><span className="starter-badge">Starter tariff</span></div>
            <p>The example time bands are prefilled—review them against your contract.</p>
          </div>

          <div className="pricing-basics">
            <label>
              <span>Base price / month</span>
              <div className="input-with-unit"><input aria-label="Base price per month" type="number" min="0" step="0.01" value={config.basePricePerMonth} onChange={(event) => update('basePricePerMonth', Number(event.target.value))} /><span>€</span></div>
            </label>
            <label>
              <span>Tax</span>
              <div className="input-with-unit"><input aria-label="Tax percent" type="number" min="0" step="0.1" value={config.taxPercent} onChange={(event) => update('taxPercent', Number(event.target.value))} /><span>%</span></div>
            </label>
            <fieldset>
              <legend>Prices entered as</legend>
              <div className="basis-toggle">
                <button type="button" className={config.priceBasis === 'net' ? 'active' : ''} aria-pressed={config.priceBasis === 'net'} onClick={() => update('priceBasis', 'net')}>Net</button>
                <button type="button" className={config.priceBasis === 'gross' ? 'active' : ''} aria-pressed={config.priceBasis === 'gross'} onClick={() => update('priceBasis', 'gross')}>Gross</button>
              </div>
            </fieldset>
          </div>

          <div className="tariff-rules-heading">
            <div><h3>Time-based prices</h3><p>Rules are evaluated from top to bottom.</p></div>
            <button type="button" className="add-rate-button" onClick={addRule}><CirclePlus size={15} /> Add price</button>
          </div>

          <div className="tariff-rules">
            {config.rules.map((rule, index) => (
              <div className="tariff-rule" key={rule.id}>
                <div className="tariff-rule-top">
                  <strong>Price {index + 1}</strong>
                  <button type="button" className="remove-rate" aria-label={`Remove price ${index + 1}`} onClick={() => removeRule(rule.id)}><Trash2 size={15} /></button>
                </div>
                <div className="tariff-rule-fields">
                  <label>
                    <span>Date range</span>
                    <div className="range-fields">
                      <input
                        aria-label={`Price ${index + 1} from date`}
                        aria-invalid={!parseRecurringDate(rule.fromDate)}
                        className={!parseRecurringDate(rule.fromDate) ? 'invalid-field' : ''}
                        inputMode="numeric"
                        placeholder="DD.MM"
                        value={rule.fromDate}
                        onChange={(event) => updateRule(rule.id, 'fromDate', event.target.value)}
                      />
                      <small>to</small>
                      <input
                        aria-label={`Price ${index + 1} to date`}
                        aria-invalid={!parseRecurringDate(rule.toDate)}
                        className={!parseRecurringDate(rule.toDate) ? 'invalid-field' : ''}
                        inputMode="numeric"
                        placeholder="DD.MM"
                        value={rule.toDate}
                        onChange={(event) => updateRule(rule.id, 'toDate', event.target.value)}
                      />
                    </div>
                    <small className={`date-format-help ${!parseRecurringDate(rule.fromDate) || !parseRecurringDate(rule.toDate) ? 'error' : ''}`}>
                      {!parseRecurringDate(rule.fromDate) || !parseRecurringDate(rule.toDate) ? 'Enter valid dates as DD.MM' : 'DD.MM · repeats yearly'}
                    </small>
                  </label>
                  <label>
                    <span>Time</span>
                    <div className="range-fields">
                      <input aria-label={`Price ${index + 1} start time`} type="time" value={rule.startTime} onChange={(event) => updateRule(rule.id, 'startTime', event.target.value)} />
                      <small>to</small>
                      <input aria-label={`Price ${index + 1} end time`} type="time" value={rule.endTime} onChange={(event) => updateRule(rule.id, 'endTime', event.target.value)} />
                    </div>
                  </label>
                  <label>
                    <span>Energy price</span>
                    <div className="input-with-unit"><input aria-label={`Price ${index + 1} cents per kilowatt-hour`} type="number" min="0" step="0.01" value={rule.centsPerKwh} onChange={(event) => updateRule(rule.id, 'centsPerKwh', Number(event.target.value))} /><span>c/kWh</span></div>
                  </label>
                </div>
              </div>
            ))}
            {config.rules.length === 0 && <div className="no-rules">No special time bands. Every reading will use the fallback price.</div>}
          </div>

          <label className="fallback-price">
            <span><strong>All other times</strong><small>Fallback when no rule above matches</small></span>
            <div className="input-with-unit"><input aria-label="Fallback cents per kilowatt-hour" type="number" min="0" step="0.01" value={config.fallbackCentsPerKwh} onChange={(event) => update('fallbackCentsPerKwh', Number(event.target.value))} /><span>c/kWh</span></div>
          </label>

          <div className="pricing-help"><Info size={14} /><span>Date ranges are inclusive and repeat yearly. End times are exclusive. Equal start and end times mean all day. Overnight bands and date ranges crossing New Year are supported.</span></div>
        </form>

        <aside className="pricing-result" aria-live="polite">
          <div className="receipt-mark"><ReceiptText size={19} /></div>
          <span className="result-label">Estimated total</span>
          <strong className="result-total">{currency.format(result.grossTotal)}</strong>
          <span className="result-tax-note">Gross · including {numberFormat.format(config.taxPercent)}% tax</span>

          <div className="cost-breakdown">
            <div><span>Energy usage</span><strong>{currency.format(result.energyInputCost)}</strong><small>{basisLabel}</small></div>
            <div><span>Prorated base price</span><strong>{currency.format(result.baseInputCost)}</strong><small>{basisLabel}</small></div>
            <div className="breakdown-divider"><span>Net total</span><strong>{currency.format(result.netTotal)}</strong></div>
            <div><span>Tax</span><strong>{currency.format(result.taxAmount)}</strong></div>
            <div className="gross-row"><span>Gross total</span><strong>{currency.format(result.grossTotal)}</strong></div>
          </div>

          <div className="rate-allocation">
            <h3>Usage by price band</h3>
            {result.allocations.map((allocation) => (
              <div className="allocation-row" key={allocation.key}>
                <div><span>{allocation.label}</span><strong>{numberFormat.format(allocation.kwh)} kWh</strong></div>
                <div className="allocation-track"><span style={{ width: `${Math.max(3, allocation.kwh / maxAllocation * 100)}%` }} /></div>
                <small>{numberFormat.format(allocation.centsPerKwh)} c/kWh · {currency.format(allocation.inputCost)} {basisLabel}</small>
              </div>
            ))}
          </div>

          <div className="proration-note"><Info size={14} /> Base price prorated across {result.coveredDays} covered calendar {result.coveredDays === 1 ? 'day' : 'days'}.</div>
        </aside>
      </div>
    </section>
  )
}
