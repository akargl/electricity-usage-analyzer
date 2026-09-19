import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import { Info } from 'lucide-react'
import type { AnalysisResult, ProfilePoint } from '../domain/types'
import { EChart } from '../shared/EChart'
import { formatKwh, tooltipKwh } from '../shared/formatters'

const ink = '#173b36'
const sage = '#6e9f91'
const lime = '#c8e676'
const grid = '#e4e5dd'
const muted = '#77827e'

const baseText = {
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  color: muted,
}

function profileOption(points: ProfilePoint[]): EChartsOption {
  return {
    animationDuration: 500,
    color: [ink, lime],
    textStyle: baseText,
    aria: { enabled: true },
    tooltip: { trigger: 'axis', valueFormatter: tooltipKwh },
    legend: { data: ['Average', 'Median'], top: 0, right: 0, icon: 'roundRect', textStyle: baseText },
    grid: { left: 14, right: 14, top: 52, bottom: 12, containLabel: true },
    xAxis: {
      type: 'category',
      data: points.map((point) => point.label),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: grid } },
      axisLabel: { color: muted },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameTextStyle: { color: muted, align: 'right' },
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: grid, type: 'dashed' } },
    },
    series: [
      {
        name: 'Average',
        type: 'bar',
        data: points.map((point) => point.mean),
        barMaxWidth: 28,
        itemStyle: { borderRadius: [5, 5, 0, 0], color: ink },
      },
      {
        name: 'Median',
        type: 'bar',
        data: points.map((point) => point.median),
        barMaxWidth: 28,
        itemStyle: { borderRadius: [5, 5, 0, 0], color: lime },
      },
    ],
  }
}

interface Props {
  analysis: AnalysisResult
}

export function Charts({ analysis }: Props) {
  const dailyOption = useMemo<EChartsOption>(() => ({
    animationDuration: 600,
    color: [sage],
    textStyle: baseText,
    aria: { enabled: true },
    tooltip: { trigger: 'axis', valueFormatter: tooltipKwh },
    grid: { left: 16, right: 16, top: 22, bottom: analysis.daily.length > 45 ? 64 : 24, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: analysis.daily.map((day) => day.date),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: grid } },
      axisLabel: { color: muted, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
      nameTextStyle: { color: muted, align: 'right' },
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: grid, type: 'dashed' } },
    },
    dataZoom: analysis.daily.length > 45 ? [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', height: 18, bottom: 8, borderColor: 'transparent', backgroundColor: '#eef0e9', fillerColor: '#b9cec6' },
    ] : undefined,
    series: [{
      name: 'Usage',
      type: 'line',
      connectNulls: false,
      showSymbol: analysis.daily.length < 60,
      symbolSize: 7,
      lineStyle: { color: sage, width: 2.5 },
      itemStyle: { color: sage, borderColor: '#f9f8f3', borderWidth: 2 },
      areaStyle: { color: 'rgba(110, 159, 145, 0.13)' },
      data: analysis.daily.map((day) => day.value),
    }],
  }), [analysis.daily])

  const weekdayOption = useMemo(() => profileOption(analysis.weekday), [analysis.weekday])
  const hourlyOption = useMemo(() => profileOption(analysis.hourly), [analysis.hourly])

  return (
    <div className="charts-layout">
      <article className="chart-card chart-wide">
        <div className="chart-heading">
          <div><span className="chart-number">01</span><h3>Usage by day</h3></div>
          <p>Daily totals across the complete timeframe</p>
        </div>
        <EChart option={dailyOption} label="Line chart of total electricity usage for each day" height={370} />
        <details className="data-table">
          <summary>View chart data</summary>
          <div className="table-scroll"><table><thead><tr><th>Date</th><th>Usage</th><th>Readings</th><th>Coverage</th></tr></thead><tbody>
            {analysis.daily.map((day) => <tr key={day.date}><td>{day.date}</td><td>{formatKwh(day.value)}</td><td>{day.readings}</td><td>{day.coverage === null ? 'Not estimated' : `${Math.round(day.coverage * 100)}%`}</td></tr>)}
          </tbody></table></div>
        </details>
      </article>

      <article className="chart-card">
        <div className="chart-heading">
          <div><span className="chart-number">02</span><h3>Weekday rhythm</h3></div>
          <p>Daily totals grouped by day of week</p>
        </div>
        <EChart option={weekdayOption} label="Bar chart comparing average and median usage for each weekday" />
        <div className="chart-note"><Info size={14} /> Each day contributes one daily total.</div>
      </article>

      <article className="chart-card">
        <div className="chart-heading">
          <div><span className="chart-number">03</span><h3>Hourly profile</h3></div>
          <p>Hourly totals grouped by hour of day</p>
        </div>
        {analysis.hourlyAvailable ? (
          <>
            <EChart option={hourlyOption} label="Bar chart comparing average and median usage for each hour of the day" />
            <div className="chart-note"><Info size={14} /> Missing hours are excluded, never treated as zero.</div>
          </>
        ) : (
          <div className="empty-chart">
            <ClockArtwork />
            <strong>Hourly profile unavailable</strong>
            <p>This dataset appears to contain daily or coarser readings, so an hourly chart would be misleading.</p>
          </div>
        )}
      </article>
    </div>
  )
}

function ClockArtwork() {
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
      <circle cx="42" cy="42" r="34" fill="#edf2ed" stroke="#b8ccc4" strokeWidth="2" />
      <path d="M42 22v21l14 8" fill="none" stroke="#38685f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="42" cy="42" r="3.5" fill="#38685f" />
      <path d="M42 12v5M72 42h-5M42 72v-5M12 42h5" stroke="#9eb9af" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
