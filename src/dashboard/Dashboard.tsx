import { ArrowLeft, Plus } from 'lucide-react'
import type { AnalysisResult, ParseResult } from '../domain/types'
import { Charts } from './Charts'
import { DataQuality } from './DataQuality'
import { SummaryCards } from './SummaryCards'

interface Props {
  analysis: AnalysisResult
  parseResult: ParseResult
  onReset: () => void
  onAddFiles: () => void
}

export function Dashboard({ analysis, parseResult, onReset, onAddFiles }: Props) {
  return (
    <main className="dashboard-shell">
      <div className="dashboard-topbar">
        <button className="back-button" type="button" onClick={onReset}><ArrowLeft size={17} /> New analysis</button>
        <div className="dashboard-actions"><span>{parseResult.files.length} {parseResult.files.length === 1 ? 'file' : 'files'} analyzed</span><button className="button secondary compact" type="button" onClick={onAddFiles}><Plus size={15} /> Add files</button></div>
      </div>

      <header className="dashboard-header">
        <div className="eyebrow">Analysis overview</div>
        <h1>Your energy, <em>made visible.</em></h1>
        <p>Patterns from your readings, calculated privately in this browser.</p>
      </header>

      <SummaryCards analysis={analysis} />
      <Charts analysis={analysis} />
      <DataQuality result={parseResult} />
    </main>
  )
}
