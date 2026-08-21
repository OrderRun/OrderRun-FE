import { useState } from 'react'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatCount } from '../../../components/formatters'

interface CancelRequestConfirmModalProps {
  open: boolean
  proposalId: string
  currentStatus: string
  offerCount: number
  refundRequired: boolean
  onClose: () => void
  onConfirm: (adminNote: string) => void
}

export function CancelRequestConfirmModal(
  props: CancelRequestConfirmModalProps,
) {
  if (!props.open) {
    return null
  }
  return <CancelRequestConfirmModalContent {...props} />
}

function CancelRequestConfirmModalContent({
  proposalId,
  currentStatus,
  offerCount,
  refundRequired,
  onClose,
  onConfirm,
}: CancelRequestConfirmModalProps) {
  const [adminNote, setAdminNote] = useState('')

  return (
    <ConfirmModal
      open
      title="요청을 취소하시겠습니까?"
      description="아직 미션이 생성되지 않았습니다."
      confirmLabel="요청 취소"
      confirmVariant="destructive"
      closeLabel="닫기"
      onClose={onClose}
      onConfirm={() => onConfirm(adminNote.trim())}
    >
      <div className="or-panel">
        <div className="or-kv-row">
          <span className="or-kv-label">요청</span>
          <span className="or-kv-value">요청 #{proposalId}</span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">상태</span>
          <span className="or-transition">
            <StatusBadge label={currentStatus} />
            <span className="or-transition-arrow">→</span>
            <StatusBadge label="취소" />
          </span>
        </div>
      </div>

      <ul className="or-notice-list">
        {offerCount > 0 ? (
          <li>연결된 지원 {formatCount(offerCount)}도 함께 취소됩니다.</li>
        ) : (
          <li>연결된 지원이 없습니다.</li>
        )}
        {refundRequired ? (
          <li className="or-notice-danger">환불 처리가 필요한 요청입니다.</li>
        ) : (
          <li>입금 전 요청이라 환불 처리는 필요하지 않습니다.</li>
        )}
      </ul>

      <label className="or-field">
        <span className="or-field-label">관리자 메모 (선택)</span>
        <textarea
          className="or-textarea"
          value={adminNote}
          placeholder="취소 사유나 확인한 내용을 남겨주세요."
          onChange={(event) => setAdminNote(event.target.value)}
        />
      </label>
    </ConfirmModal>
  )
}
