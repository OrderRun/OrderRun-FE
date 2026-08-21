interface EmptyStateProps {
  message: string
  hint?: string
}

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="or-empty">
      <p className="or-empty-message">{message}</p>
      {hint ? <p className="or-empty-hint">{hint}</p> : null}
    </div>
  )
}
