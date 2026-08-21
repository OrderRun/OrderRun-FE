import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmModalProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  confirmVariant?: 'primary' | 'destructive'
  closeLabel?: string
  rejectLabel?: string
  onReject?: () => void
  disabled?: boolean
  onClose: () => void
  onConfirm: () => void
  children?: ReactNode
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  closeLabel = '닫기',
  rejectLabel,
  onReject,
  disabled = false,
  onClose,
  onConfirm,
  children,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {closeLabel}
          </Button>
          {rejectLabel !== undefined && onReject !== undefined ? (
            <Button variant="destructive" onClick={onReject}>
              {rejectLabel}
            </Button>
          ) : null}
          <Button variant={confirmVariant} disabled={disabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <p className="or-modal-desc">{description}</p> : null}
      {children}
    </Modal>
  )
}
