import { useState } from 'react'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatAmount } from '../../../components/formatters'

interface MissionPayoutModalProps {
  open: boolean
  missionId: string
  payoutAmount: number
  payoutAccount: string
  payoutAccountHolder: string
  requestStatus: string
  onClose: () => void
  onConfirm: (adminNote: string) => void
  onReject: (adminNote: string) => void
}

export function MissionPayoutModal(props: MissionPayoutModalProps) {
  if (!props.open) {
    return null
  }
  return <MissionPayoutModalContent {...props} />
}

function MissionPayoutModalContent({
  missionId,
  payoutAmount,
  payoutAccount,
  payoutAccountHolder,
  requestStatus,
  onClose,
  onConfirm,
  onReject,
}: MissionPayoutModalProps) {
  const [adminNote, setAdminNote] = useState('')

  return (
    <ConfirmModal
      open
      title="수행비 입금"
      description="꼬붕에게 수행비를 입금한 뒤 처리 완료로 변경합니다."
      confirmLabel="입금 완료"
      rejectLabel="반려"
      onReject={() => onReject(adminNote.trim())}
      onClose={onClose}
      onConfirm={() => onConfirm(adminNote.trim())}
    >
      <div className="or-panel">
        <div className="or-kv-row">
          <span className="or-kv-label">미션</span>
          <span className="or-kv-value">미션 #{missionId}</span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">수행비</span>
          <span className="or-kv-value">{formatAmount(payoutAmount)}</span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">요청 상태</span>
          <span className="or-transition">
            <StatusBadge label={requestStatus} />
            <span className="or-transition-arrow">→</span>
            <StatusBadge label={requestStatus} />
          </span>
        </div>
      </div>

      <div className="or-panel">
        <div className="or-kv-row">
          <span className="or-kv-label">입금 계좌</span>
          <span className="or-kv-value">{payoutAccount}</span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">예금주명</span>
          <span className="or-kv-value">{payoutAccountHolder}</span>
        </div>
      </div>

      <label className="or-field">
        <span className="or-field-label">관리자 메모 (선택)</span>
        <textarea
          className="or-textarea"
          value={adminNote}
          placeholder="입금 근거나 확인한 내용을 남겨주세요."
          onChange={(event) => setAdminNote(event.target.value)}
        />
      </label>
    </ConfirmModal>
  )
}
