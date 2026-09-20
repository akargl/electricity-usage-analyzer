import { FilePlus2, LockKeyhole, Sparkles, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { formatBytes } from '../shared/formatters'

interface Props {
  files: File[]
  onFiles: (files: File[]) => void
  onSample: () => void
}

export function FileDropzone({ files, onFiles, onSample }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function addFiles(incoming: File[]) {
    const csvFiles = incoming.filter((file) => file.name.toLowerCase().endsWith('.csv'))
    const known = new Set(files.map((file) => `${file.name}|${file.size}|${file.lastModified}`))
    onFiles([...files, ...csvFiles.filter((file) => !known.has(`${file.name}|${file.size}|${file.lastModified}`))])
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="section-kicker">01 · Source data</div>
      <div className="section-heading">
        <div>
          <h2 id="upload-title">Bring your readings</h2>
          <p>Add one or more CSV usage exports from your electricity provider</p>
        </div>
        <div className="privacy-badge"><LockKeyhole size={14} /> All data is processed locally in your browser</div>
      </div>

      <div
        className={`dropzone ${dragging ? 'is-dragging' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { event.preventDefault(); setDragging(false) }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          addFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
        />
        <div className="dropzone-icon"><UploadCloud size={27} strokeWidth={1.7} /></div>
        <div>
          <strong>Drop CSV files here</strong>
          <span>or choose them from your device</span>
        </div>
        <button className="button secondary" type="button" onClick={() => inputRef.current?.click()}>
          <FilePlus2 size={16} /> Choose files
        </button>
      </div>

      {files.length > 0 && (
        <div className="file-list" aria-label="Selected files">
          {files.map((file, index) => (
            <div className="file-row" key={`${file.name}-${file.lastModified}`}>
              <span className="file-index">{String(index + 1).padStart(2, '0')}</span>
              <div className="file-info"><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div>
              <button
                className="icon-button"
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onFiles(files.filter((candidate) => candidate !== file))}
              >
                <X size={17} />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <button className="sample-link" type="button" onClick={onSample}>
          <Sparkles size={15} /> No usage reports at hand? Explore with some sample data
        </button>
      )}
    </section>
  )
}
