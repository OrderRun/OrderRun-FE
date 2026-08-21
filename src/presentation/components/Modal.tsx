import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}

export function Modal({ open, title, onClose, footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="or-modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="or-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="or-modal-head">
          <h2 className="or-modal-title">{title}</h2>
          <button
            type="button"
            className="or-modal-close"
            aria-label="닫기"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="or-modal-body">{children}</div>
        {footer ? <div className="or-modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}
