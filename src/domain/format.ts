/**
 * Display formatting for SWAPI values.
 *
 * SWAPI sends every value as a string and uses "unknown", "n/a", "none" or
 * an empty string for missing data. These helpers turn raw values into
 * consistent, readable text so components never show raw API placeholders.
 */

const MISSING: Record<string, string> = {
  '': 'Unknown',
  unknown: 'Unknown',
  'n/a': 'N/A',
  none: 'None',
}

function missingLabel(raw: string | undefined | null): string | null {
  if (raw === undefined || raw === null) return 'Unknown'
  return MISSING[raw.trim().toLowerCase()] ?? null
}

/** Free text such as "blue" or "desert". */
export function formatText(raw: string | undefined | null): string {
  return missingLabel(raw) ?? raw!.trim()
}

/**
 * A number with thousands separators and an optional unit,
 * e.g. ("200000") -> "200,000" and ("172", "cm") -> "172 cm".
 * Non-numeric values (e.g. "indefinite") are shown as text.
 */
export function formatNumber(raw: string | undefined | null, unit?: string): string {
  const missing = missingLabel(raw)
  if (missing) return missing
  const value = Number(raw!.replace(/,/g, ''))
  if (!Number.isFinite(value)) return raw!.trim()
  const text = value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return unit ? `${text}${unit === '%' ? '' : ' '}${unit}` : text
}

/** "Crew / Passengers" pairs, e.g. ("1", "0") -> "1 / 0". */
export function formatPair(a: string | undefined | null, b: string | undefined | null): string {
  return `${formatNumber(a)} / ${formatNumber(b)}`
}
