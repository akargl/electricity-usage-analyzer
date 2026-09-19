import { ChevronDown, Settings2 } from 'lucide-react'
import { useState } from 'react'
import type { ImportConfig, TimestampFormat } from '../domain/types'

interface Props {
  config: ImportConfig
  onChange: (config: ImportConfig) => void
}

const timestampFormats: { value: TimestampFormat; label: string }[] = [
  { value: 'auto', label: 'Detect automatically' },
  { value: 'iso', label: 'ISO 8601' },
  { value: 'dd.MM.yyyy HH:mm', label: 'DD.MM.YYYY HH:mm' },
  { value: 'dd.MM.yyyy HH:mm:ss', label: 'DD.MM.YYYY HH:mm:ss' },
  { value: 'dd/MM/yyyy HH:mm', label: 'DD/MM/YYYY HH:mm' },
  { value: 'MM/dd/yyyy HH:mm', label: 'MM/DD/YYYY HH:mm' },
  { value: 'yyyy-MM-dd HH:mm', label: 'YYYY-MM-DD HH:mm' },
  { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss' },
]

export function ImportSettings({ config, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const update = <K extends keyof ImportConfig>(key: K, value: ImportConfig[K]) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <section className="settings-section" aria-labelledby="settings-title">
      <button className="settings-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div>
          <span className="settings-icon"><Settings2 size={17} /></span>
          <span>
            <strong id="settings-title">Import settings</strong>
            <small>Row {config.startRow} · Column {config.timestampColumn} → time · Column {config.usageColumn} → kWh · “{config.delimiter}” separator</small>
          </span>
        </div>
        <ChevronDown size={18} className={open ? 'rotated' : ''} />
      </button>

      {open && (
        <div className="settings-grid">
          <label>
            <span>First data row</span>
            <input type="number" min="1" value={config.startRow} onChange={(event) => update('startRow', Math.max(1, Number(event.target.value)))} />
          </label>
          <label>
            <span>Timestamp column</span>
            <input type="number" min="1" value={config.timestampColumn} onChange={(event) => update('timestampColumn', Math.max(1, Number(event.target.value)))} />
          </label>
          <label>
            <span>Usage column</span>
            <input type="number" min="1" value={config.usageColumn} onChange={(event) => update('usageColumn', Math.max(1, Number(event.target.value)))} />
          </label>
          <label>
            <span>Column separator</span>
            <select value={config.delimiter} onChange={(event) => update('delimiter', event.target.value)}>
              <option value=";">Semicolon (;)</option>
              <option value=",">Comma (,)</option>
              <option value={'\t'}>Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </label>
          <label className="span-2">
            <span>Timestamp format</span>
            <select value={config.timestampFormat} onChange={(event) => update('timestampFormat', event.target.value as TimestampFormat)}>
              {timestampFormats.map((format) => <option value={format.value} key={format.value}>{format.label}</option>)}
            </select>
          </label>
          <label>
            <span>Decimal separator</span>
            <select value={config.decimalSeparator} onChange={(event) => update('decimalSeparator', event.target.value as ImportConfig['decimalSeparator'])}>
              <option value="auto">Detect automatically</option>
              <option value="comma">Comma (,)</option>
              <option value="period">Period (.)</option>
            </select>
          </label>
          <label>
            <span>Time zone</span>
            <input list="timezones" value={config.timeZone} onChange={(event) => update('timeZone', event.target.value)} />
            <datalist id="timezones">
              <option value="local" />
              <option value="UTC" />
              <option value="Europe/Vienna" />
              <option value="Europe/Berlin" />
              <option value="America/New_York" />
            </datalist>
          </label>
          <label>
            <span>Encoding</span>
            <select value={config.encoding} onChange={(event) => update('encoding', event.target.value)}>
              <option value="UTF-8">UTF-8</option>
              <option value="windows-1252">Windows-1252</option>
              <option value="ISO-8859-1">ISO-8859-1</option>
            </select>
          </label>
          <label className="checkbox-row span-2">
            <input type="checkbox" checked={config.deduplicateExact} onChange={(event) => update('deduplicateExact', event.target.checked)} />
            <span><strong>Remove exact duplicate readings</strong><small>Matching timestamp and kWh values across files are counted once.</small></span>
          </label>
        </div>
      )}
    </section>
  )
}
