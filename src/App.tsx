import { Activity, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { defaultImportConfig, type ImportConfig, type ParseResult, type WorkerResponse } from './domain/types'
import { FileDropzone } from './import/FileDropzone'
import { FilePreview } from './import/FilePreview'
import { ImportSettings } from './import/ImportSettings'
import { aggregateReadings } from './processing/aggregate'

type Phase = 'import' | 'processing' | 'dashboard'

const Dashboard = lazy(() => import('./dashboard/Dashboard').then((module) => ({ default: module.Dashboard })))

function sampleFile() {
  const rows = ['Electricity export;Generated locally;Sample', 'Timestamp;Meter;Usage (kWh)']
  const start = new Date(2026, 7, 3, 0, 0, 0, 0)
  for (let index = 0; index < 14 * 96; index += 1) {
    const time = new Date(start.getTime() + index * 15 * 60_000)
    const day = String(time.getDate()).padStart(2, '0')
    const month = String(time.getMonth() + 1).padStart(2, '0')
    const hours = String(time.getHours()).padStart(2, '0')
    const minutes = String(time.getMinutes()).padStart(2, '0')
    const hour = time.getHours() + time.getMinutes() / 60
    const base = hour >= 17 && hour <= 22 ? 0.24 : hour >= 6 && hour <= 9 ? 0.17 : 0.08
    const weekend = time.getDay() === 0 || time.getDay() === 6 ? 1.18 : 1
    const variation = ((index * 17) % 23) / 500
    const usage = (base * weekend + variation).toFixed(3).replace('.', ',')
    rows.push(`${day}.${month}.${time.getFullYear()} ${hours}:${minutes};Home;${index % 317 === 0 ? '' : usage}`)
  }
  return new File([rows.join('\n')], 'sample-electricity-15min.csv', { type: 'text/csv', lastModified: Date.now() })
}

export default function App() {
  const [files, setFiles] = useState<File[]>([])
  const [config, setConfig] = useState<ImportConfig>(defaultImportConfig)
  const [phase, setPhase] = useState<Phase>('import')
  const [progress, setProgress] = useState('Preparing files…')
  const [error, setError] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const analysis = useMemo(
    () => parseResult ? aggregateReadings(parseResult.readings, config.timeZone) : null,
    [parseResult, config.timeZone],
  )

  function analyze() {
    if (files.length === 0) return
    workerRef.current?.terminate()
    setError(null)
    setPhase('processing')
    setProgress(`Preparing ${files.length} ${files.length === 1 ? 'file' : 'files'}…`)

    const worker = new Worker(new URL('./processing/csv.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.type === 'progress') {
        setProgress(`Reading ${message.fileName} · ${message.fileIndex + 1} of ${message.fileCount}`)
      } else if (message.type === 'complete') {
        worker.terminate()
        workerRef.current = null
        if (message.result.readings.length === 0) {
          setError('No valid readings were found. Check the selected row, columns, timestamp format, and decimal separator.')
          setPhase('import')
          return
        }
        setParseResult(message.result)
        setPhase('dashboard')
      } else {
        worker.terminate()
        workerRef.current = null
        setError(message.message)
        setPhase('import')
      }
    }
    worker.onerror = (event) => {
      worker.terminate()
      workerRef.current = null
      setError(event.message || 'The files could not be processed.')
      setPhase('import')
    }
    worker.postMessage({ type: 'parse', files, config })
  }

  function reset() {
    workerRef.current?.terminate()
    workerRef.current = null
    setFiles([])
    setParseResult(null)
    setError(null)
    setPhase('import')
  }

  if (phase === 'dashboard' && parseResult && analysis) {
    return (
      <Suspense fallback={<LoadingDashboard />}>
        <Dashboard
          analysis={analysis}
          parseResult={parseResult}
          onReset={reset}
          onAddFiles={() => setPhase('import')}
        />
      </Suspense>
    )
  }

  return (
    <div className="site-shell">
      <nav className="site-nav" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Current home"><span><Zap size={18} fill="currentColor" /></span>Current</a>
        <div className="nav-note"><ShieldCheck size={15} /> 100% private · browser-based</div>
      </nav>

      <main id="top" className="import-main">
        <header className="hero">
          <div className="eyebrow"><span /> Electricity usage analyzer</div>
          <h1>See where your<br /><em>energy goes.</em></h1>
          <p>Turn raw meter exports into clear daily and hourly patterns—privately, right in your browser.</p>
          <div className="hero-points"><span><Activity size={15} /> Multiple files</span><span>·</span><span>Missing-data aware</span><span>·</span><span>No upload</span></div>
        </header>

        <div className="import-card">
          <FileDropzone files={files} onFiles={setFiles} onSample={() => setFiles([sampleFile()])} />
          {files.length > 0 && (
            <>
              <ImportSettings config={config} onChange={setConfig} />
              <FilePreview file={files[0]} config={config} />
              {error && <div className="error-banner" role="alert">{error}</div>}
              <div className="analyze-row">
                <div><ShieldCheck size={17} /><span><strong>Nothing is uploaded</strong><small>Analysis happens entirely on this device.</small></span></div>
                <button className="button primary" type="button" onClick={analyze}>
                  Analyze {files.length === 1 ? 'file' : `${files.length} files`} <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer><span>Current</span><p>Your readings stay yours.</p><p>Built for clarity, not the cloud.</p></footer>

      {phase === 'processing' && (
        <div className="processing-overlay" role="status" aria-live="polite">
          <div className="processing-card">
            <div className="pulse-logo"><Zap size={24} fill="currentColor" /></div>
            <h2>Finding the signal</h2>
            <p>{progress}</p>
            <div className="progress-track"><span /></div>
            <small>Your readings are being processed locally.</small>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingDashboard() {
  return (
    <div className="processing-overlay" role="status">
      <div className="processing-card">
        <div className="pulse-logo"><Zap size={24} fill="currentColor" /></div>
        <h2>Drawing your patterns</h2>
        <p>Preparing the dashboard…</p>
        <div className="progress-track"><span /></div>
      </div>
    </div>
  )
}
