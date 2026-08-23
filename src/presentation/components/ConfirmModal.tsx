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
  /** 처리 중이거나 조건을 못 갖춰 눌러선 안 되는 상태. 확인·반려 둘 다 막는다. */
  disabled?: boolean
  /** 처리 실패 문구. 모달을 연 채로 보여준다. */
  error?: string | null
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
  error = null,
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
            <Button variant="destructive" disabled={disabled} onClick={onReject}>
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
      {error === null ? null : (
        <p className="or-error-text" role="alert">
          {error}
        </p>
      )}
    </Modal>
  )
}
