export type TimestampFormat =
  | 'auto'
  | 'iso'
  | 'dd.MM.yyyy HH:mm'
  | 'dd.MM.yyyy HH:mm:ss'
  | 'dd/MM/yyyy HH:mm'
  | 'MM/dd/yyyy HH:mm'
  | 'yyyy-MM-dd HH:mm'
  | 'yyyy-MM-dd HH:mm:ss'

export type DecimalSeparator = 'auto' | 'comma' | 'period'

export interface ImportConfig {
  startRow: number
  timestampColumn: number
  usageColumn: number
  delimiter: string
  timestampFormat: TimestampFormat
  decimalSeparator: DecimalSeparator
  timeZone: string
  encoding: string
  deduplicateExact: boolean
}

export const defaultImportConfig: ImportConfig = {
  startRow: 3,
  timestampColumn: 1,
  usageColumn: 3,
  delimiter: ';',
  timestampFormat: 'auto',
  decimalSeparator: 'auto',
  timeZone: 'local',
  encoding: 'UTF-8',
  deduplicateExact: true,
}

export interface Reading {
  timestamp: number
  valueKwh: number
  source: string
  row: number
}

export type IssueKind =
  | 'missing-timestamp'
  | 'invalid-timestamp'
  | 'missing-usage'
  | 'invalid-usage'
  | 'negative-usage'
  | 'csv-error'

export interface ImportIssue {
  source: string
  row: number
  kind: IssueKind
  value?: string
  message: string
}

export interface FileSummary {
  name: string
  size: number
  rowsSeen: number
  accepted: number
  missing: number
  invalid: number
}

export interface ParseResult {
  readings: Reading[]
  issues: ImportIssue[]
  files: FileSummary[]
  duplicateCount: number
  overlapCount: number
  issueCount: number
}

export type WorkerRequest = {
  type: 'parse'
  files: File[]
  config: ImportConfig
}

export type WorkerResponse =
  | { type: 'progress'; fileName: string; fileIndex: number; fileCount: number }
  | { type: 'complete'; result: ParseResult }
  | { type: 'error'; message: string }

export interface DailyUsage {
  date: string
  value: number | null
  readings: number
  coverage: number | null
  incomplete: boolean
}

export interface ProfilePoint {
  key: number
  label: string
  mean: number | null
  median: number | null
  samples: number
}

export interface AnalysisResult {
  totalKwh: number
  firstTimestamp: number
  lastTimestamp: number
  validReadings: number
  typicalIntervalMinutes: number | null
  daily: DailyUsage[]
  weekday: ProfilePoint[]
  hourly: ProfilePoint[]
  hourlyAvailable: boolean
  incompleteDays: number
}
