interface InfoTableProps {
  rows: Array<[label: string, value: string]>
  variant?: 'grid' | 'plain'
}

/** Label/value rows used by the attributes, species and homeworld cards. */
export function InfoTable({ rows, variant = 'plain' }: InfoTableProps) {
  return (
    <dl className={`info-table info-table--${variant}`}>
      {rows.map(([label, value]) => (
        <div className="info-table__row" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
