import { AlertTriangle, CheckCircle2, FileWarning, Layers3 } from 'lucide-react'
import type { ParseResult } from '../domain/types'
import { formatBytes, numberFormat } from '../shared/formatters'

interface Props {
  result: ParseResult
}

export function DataQuality({ result }: Props) {
  return (
    <section className="quality-section" aria-labelledby="quality-title">
      <div className="quality-heading">
        <div><span className="quality-icon"><CheckCircle2 size={19} /></span><div><h3 id="quality-title">Data quality</h3><p>What was included, skipped, or combined.</p></div></div>
        <span className={`quality-status ${result.issueCount > 0 ? 'has-warnings' : ''}`}>
          {result.issueCount > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          {result.issueCount > 0 ? `${numberFormat.format(result.issueCount)} rows need attention` : 'All rows look good'}
        </span>
      </div>

      <div className="quality-files">
        {result.files.map((file) => (
          <div className="quality-file" key={file.name}>
            <FileWarning size={17} />
            <div><strong>{file.name}</strong><span>{formatBytes(file.size)} · {numberFormat.format(file.accepted)} valid · {numberFormat.format(file.missing)} missing · {numberFormat.format(file.invalid)} invalid</span></div>
          </div>
        ))}
        {(result.duplicateCount > 0 || result.overlapCount > 0) && (
          <div className="quality-file">
            <Layers3 size={17} />
            <div><strong>Overlapping timestamps</strong><span>{result.duplicateCount} exact duplicates removed · {result.overlapCount} overlapping rows detected</span></div>
          </div>
        )}
      </div>

      {result.issues.length > 0 && (
        <details className="issues-list">
          <summary>Review skipped rows {result.issueCount > result.issues.length && `(showing first ${result.issues.length})`}</summary>
          <div className="table-scroll">
            <table><thead><tr><th>File</th><th>Row</th><th>Issue</th><th>Original value</th></tr></thead><tbody>
              {result.issues.map((issue, index) => (
                <tr key={`${issue.source}-${issue.row}-${index}`}><td>{issue.source}</td><td>{issue.row}</td><td>{issue.message}</td><td>{issue.value ?? '—'}</td></tr>
              ))}
            </tbody></table>
          </div>
        </details>
      )}
    </section>
  )
}
