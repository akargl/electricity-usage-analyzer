/// <reference lib="webworker" />

import Papa from 'papaparse'
import type {
  FileSummary,
  ImportConfig,
  ImportIssue,
  ParseResult,
  Reading,
  WorkerRequest,
  WorkerResponse,
} from '../domain/types'
import { parseTimestamp, parseUsage } from './parsers'

const worker = self as DedicatedWorkerGlobalScope
const MAX_REPORTED_ISSUES = 500

function post(message: WorkerResponse) {
  worker.postMessage(message)
}

function addIssue(issues: ImportIssue[], issue: ImportIssue) {
  if (issues.length < MAX_REPORTED_ISSUES) issues.push(issue)
}

function parseFile(
  file: File,
  config: ImportConfig,
  issues: ImportIssue[],
): Promise<{ readings: Reading[]; summary: FileSummary; issueCount: number }> {
  return new Promise((resolve, reject) => {
    const readings: Reading[] = []
    const summary: FileSummary = {
      name: file.name,
      size: file.size,
      rowsSeen: 0,
      accepted: 0,
      missing: 0,
      invalid: 0,
    }
    let rowNumber = 0
    let issueCount = 0

    Papa.parse<string[]>(file, {
      delimiter: config.delimiter,
      encoding: config.encoding,
      skipEmptyLines: 'greedy',
      step: (result) => {
        rowNumber += 1
        if (rowNumber < config.startRow) return
        summary.rowsSeen += 1

        if (result.errors.length > 0) {
          summary.invalid += 1
          issueCount += 1
          addIssue(issues, {
            source: file.name,
            row: rowNumber,
            kind: 'csv-error',
            message: result.errors[0].message,
          })
          return
        }

        const row = result.data
        const rawTimestamp = String(row[config.timestampColumn - 1] ?? '').trim()
        const rawUsage = String(row[config.usageColumn - 1] ?? '').trim()

        if (!rawTimestamp) {
          summary.invalid += 1
          issueCount += 1
          addIssue(issues, {
            source: file.name,
            row: rowNumber,
            kind: 'missing-timestamp',
            message: 'Timestamp is missing',
          })
          return
        }

        if (!rawUsage) {
          summary.missing += 1
          issueCount += 1
          addIssue(issues, {
            source: file.name,
            row: rowNumber,
            kind: 'missing-usage',
            message: 'Usage is missing and was ignored',
          })
          return
        }

        const timestamp = parseTimestamp(rawTimestamp, config.timestampFormat, config.timeZone)
        if (timestamp === null) {
          summary.invalid += 1
          issueCount += 1
          addIssue(issues, {
            source: file.name,
            row: rowNumber,
            kind: 'invalid-timestamp',
            value: rawTimestamp,
            message: 'Timestamp could not be parsed',
          })
          return
        }

        const usage = parseUsage(rawUsage, config.decimalSeparator)
        if (usage === null) {
          summary.invalid += 1
          issueCount += 1
          addIssue(issues, {
            source: file.name,
            row: rowNumber,
            kind: 'invalid-usage',
            value: rawUsage,
            message: 'Usage is not a valid number',
          })
          return
        }

        if (usage < 0) {
          summary.invalid += 1
          issueCount += 1
          addIssue(issues, {
            source: file.name,
            row: rowNumber,
            kind: 'negative-usage',
            value: rawUsage,
            message: 'Negative usage was ignored',
          })
          return
        }

        readings.push({ timestamp, valueKwh: usage, source: file.name, row: rowNumber })
        summary.accepted += 1
      },
      complete: () => resolve({ readings, summary, issueCount }),
      error: (error) => reject(error),
    })
  })
}

function resolveOverlaps(readings: Reading[], deduplicate: boolean) {
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp)
  const signatures = new Set<string>()
  const timestamps = new Set<number>()
  const output: Reading[] = []
  let duplicateCount = 0
  let overlapCount = 0

  for (const reading of sorted) {
    const signature = `${reading.timestamp}|${reading.valueKwh}`
    if (timestamps.has(reading.timestamp)) overlapCount += 1
    timestamps.add(reading.timestamp)

    if (deduplicate && signatures.has(signature)) {
      duplicateCount += 1
      continue
    }
    signatures.add(signature)
    output.push(reading)
  }

  return { readings: output, duplicateCount, overlapCount }
}

worker.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== 'parse') return

  try {
    const { files, config } = event.data
    const issues: ImportIssue[] = []
    const summaries: FileSummary[] = []
    const allReadings: Reading[] = []
    let issueCount = 0

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      post({ type: 'progress', fileName: file.name, fileIndex: index, fileCount: files.length })
      const parsed = await parseFile(file, config, issues)
      summaries.push(parsed.summary)
      allReadings.push(...parsed.readings)
      issueCount += parsed.issueCount
    }

    const resolved = resolveOverlaps(allReadings, config.deduplicateExact)
    const result: ParseResult = {
      readings: resolved.readings,
      issues,
      files: summaries,
      duplicateCount: resolved.duplicateCount,
      overlapCount: resolved.overlapCount,
      issueCount,
    }
    post({ type: 'complete', result })
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : 'Unknown parsing error' })
  }
}

export {}
