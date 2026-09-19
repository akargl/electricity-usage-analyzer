export const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

export function formatKwh(value: number | null) {
  return value === null ? '—' : `${numberFormat.format(value)} kWh`
}

export function tooltipKwh(value: unknown) {
  return typeof value === 'number' ? formatKwh(value) : 'No reading'
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${numberFormat.format(bytes / 1024)} KB`
  return `${numberFormat.format(bytes / 1024 / 1024)} MB`
}

export function formatInterval(minutes: number | null) {
  if (minutes === null) return 'Unknown'
  if (minutes < 60) return `${numberFormat.format(minutes)} min`
  if (minutes < 24 * 60) return `${numberFormat.format(minutes / 60)} hr`
  return `${numberFormat.format(minutes / 60 / 24)} days`
}
