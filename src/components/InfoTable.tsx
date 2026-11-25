/** One label/value row, with an optional explanation shown on hover or focus. */
export type InfoRow = [label: string, value: string, hint?: string]

interface InfoTableProps {
  rows: InfoRow[]
  variant?: 'grid' | 'plain'
}

/** Label/value rows used by the attributes, species and homeworld cards. */
export function InfoTable({ rows, variant = 'plain' }: InfoTableProps) {
  return (
    <dl className={`info-table info-table--${variant}`}>
      {rows.map(([label, value, hint]) => (
        <div className="info-table__row" key={label}>
          <dt>
            {label}
            {hint && <InfoHint text={hint} />}
          </dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * A small "i" marker that explains a term. The text appears as a tooltip on
 * hover or keyboard focus and is also read by screen readers.
 */
function InfoHint({ text }: { text: string }) {
  return (
    <span className="hint" tabIndex={0} data-hint={text}>
      <span aria-hidden="true">i</span>
      <span className="visually-hidden">{text}</span>
    </span>
  )
}
