interface StatusMessageProps {
  kind: 'loading' | 'empty' | 'error'
  message: string
  onRetry?: () => void
}

/** Shared presentation for loading, empty and error states. */
export function StatusMessage({ kind, message, onRetry }: StatusMessageProps) {
  return (
    <div
      className={`status status--${kind}`}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="status__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
