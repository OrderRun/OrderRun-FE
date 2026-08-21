import { useState } from 'react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { StatusBadge } from '../../../components/StatusBadge'

interface StatusChangeModalProps {
  open: boolean
  proposalId: string
  currentStatus: string
  nextStatus: string
  requiresOpenChatUrl?: boolean
  destructive?: boolean
  guide?: string
  notices?: string[]
  onClose: () => void
  onConfirm: (openChatUrl: string) => void
}

function toChangeLabel(status: string): string {
  const lastCode = status.charCodeAt(status.length - 1)
  const isHangul = lastCode >= 0xac00 && lastCode <= 0xd7a3
  const finalConsonant = isHangul ? (lastCode - 0xac00) % 28 : 0
  const particle =
    !isHangul || finalConsonant === 0 || finalConsonant === 8 ? '로' : '으로'
  return `${status}${particle} 변경`
}

function isValidUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

export function StatusChangeModal(props: StatusChangeModalProps) {
  if (!props.open) {
    return null
  }
  return <StatusChangeModalContent {...props} />
}

function StatusChangeModalContent({
  proposalId,
  currentStatus,
  nextStatus,
  requiresOpenChatUrl = false,
  destructive = false,
  guide,
  notices,
  onClose,
  onConfirm,
}: StatusChangeModalProps) {
  const [openChatUrl, setOpenChatUrl] = useState('')

  const trimmedUrl = openChatUrl.trim()
  const showUrlError =
    requiresOpenChatUrl && trimmedUrl !== '' && !isValidUrl(trimmedUrl)
  const confirmDisabled =
    requiresOpenChatUrl && (trimmedUrl === '' || !isValidUrl(trimmedUrl))

  return (
    <Modal
      open
      title="상태 변경"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            disabled={confirmDisabled}
            onClick={() => onConfirm(trimmedUrl)}
          >
            {toChangeLabel(nextStatus)}
          </Button>
        </>
      }
    >
      <div className="or-panel">
        <div className="or-kv-row">
          <span className="or-kv-label">요청</span>
          <span className="or-kv-value">요청 #{proposalId}</span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">현재 상태</span>
          <span className="or-transition">
            <StatusBadge label={currentStatus} />
            <span className="or-transition-arrow">→</span>
            <StatusBadge label={nextStatus} />
          </span>
        </div>
      </div>

      {requiresOpenChatUrl ? (
        <label className="or-field">
          <span className="or-field-label">오픈채팅방 URL *</span>
          <input
            className={`or-input${showUrlError ? ' or-input-error' : ''}`}
            type="text"
            value={openChatUrl}
            placeholder="https://open.kakao.com/..."
            onChange={(event) => setOpenChatUrl(event.target.value)}
          />
          {showUrlError ? (
            <span className="or-error-text">올바른 URL 형식이 아닙니다.</span>
          ) : null}
        </label>
      ) : null}

      {guide ? <p className="or-help-text">{guide}</p> : null}

      {notices && notices.length > 0 ? (
        <ul className="or-notice-list">
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      ) : null}
    </Modal>
  )
}
