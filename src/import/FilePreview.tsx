import Papa from 'papaparse'
import { useEffect, useState } from 'react'
import type { ImportConfig } from '../domain/types'

interface Props {
  file?: File
  config: ImportConfig
}

export function FilePreview({ file, config }: Props) {
  const [rows, setRows] = useState<string[][]>([])

  useEffect(() => {
    let cancelled = false
    if (!file) {
      setRows([])
      return
    }

    file.slice(0, 128 * 1024).text().then((text) => {
      const result = Papa.parse<string[]>(text, {
        delimiter: config.delimiter,
        preview: Math.max(config.startRow + 3, 6),
        skipEmptyLines: false,
      })
      if (!cancelled) setRows(result.data)
    })

    return () => { cancelled = true }
  }, [file, config.delimiter, config.startRow])

  if (!file || rows.length === 0) return null

  const maxColumns = Math.min(Math.max(...rows.map((row) => row.length)), 8)

  return (
    <details className="preview">
      <summary>Preview {file.name}</summary>
      <div className="preview-scroll">
        <table>
          <thead><tr><th>Row</th>{Array.from({ length: maxColumns }, (_, index) => <th key={index}>Column {index + 1}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex + 1 < config.startRow ? 'ignored-row' : ''}>
                <th>{rowIndex + 1}</th>
                {Array.from({ length: maxColumns }, (_, columnIndex) => (
                  <td
                    key={columnIndex}
                    className={columnIndex + 1 === config.timestampColumn ? 'time-column' : columnIndex + 1 === config.usageColumn ? 'usage-column' : ''}
                  >
                    {row[columnIndex] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="preview-legend"><span className="time-dot" /> timestamp <span className="usage-dot" /> usage <span className="muted-dot" /> ignored header</div>
    </details>
  )
}
