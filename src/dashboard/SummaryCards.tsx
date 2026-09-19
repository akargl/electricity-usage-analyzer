import { Activity, CalendarDays, Clock3, Gauge } from 'lucide-react'
import type { AnalysisResult } from '../domain/types'
import { formatInterval, formatKwh, numberFormat } from '../shared/formatters'

interface Props {
  analysis: AnalysisResult
}

export function SummaryCards({ analysis }: Props) {
  const dateFormatter = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
  const range = `${dateFormatter.format(analysis.firstTimestamp)} — ${dateFormatter.format(analysis.lastTimestamp)}`

  return (
    <div className="summary-grid">
      <article className="summary-card accent-card">
        <span className="summary-icon"><Gauge size={18} /></span>
        <small>Total consumption</small>
        <strong>{formatKwh(analysis.totalKwh)}</strong>
        <span>Across all valid readings</span>
      </article>
      <article className="summary-card">
        <span className="summary-icon"><CalendarDays size={18} /></span>
        <small>Date range</small>
        <strong className="range-value">{range}</strong>
        <span>{numberFormat.format(analysis.daily.length)} calendar days</span>
      </article>
      <article className="summary-card">
        <span className="summary-icon"><Activity size={18} /></span>
        <small>Valid readings</small>
        <strong>{numberFormat.format(analysis.validReadings)}</strong>
        <span>{analysis.incompleteDays} potentially incomplete days</span>
      </article>
      <article className="summary-card">
        <span className="summary-icon"><Clock3 size={18} /></span>
        <small>Typical interval</small>
        <strong>{formatInterval(analysis.typicalIntervalMinutes)}</strong>
        <span>Inferred from timestamps</span>
      </article>
    </div>
  )
}
