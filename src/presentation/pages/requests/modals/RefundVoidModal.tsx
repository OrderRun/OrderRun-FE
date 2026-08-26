import { useState } from 'react'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatAmount } from '../../../components/formatters'

/**
 * 입금 대조 결과 **입금이 없어** 환불 없이 종결하는 모달. 환불 반려가 아니라
 * 받은 돈이 없다는 뜻이다. 돈을 지급하지 않고 종결하는 유일한 경로라 서버가
 * `adminNote`를 필수(1~200자)로 받는다.
 */
const NOTE_MIN_LENGTH = 1
const NOTE_MAX_LENGTH = 200

interface RefundVoidModalProps {
  open: boolean
  proposalId: string
  amount: number
  pending: boolean
  error: string | null
  onClose: () => void
  onConfirm: (adminNote: string) => void
}

export function RefundVoidModal(props: RefundVoidModalProps) {
  if (!props.open) {
    return null
  }
  return <RefundVoidModalContent {...props} />
}

function RefundVoidModalContent({
  proposalId,
  amount,
  pending,
  error,
  onClose,
  onConfirm,
}: RefundVoidModalProps) {
  const [note, setNote] = useState('')
  const trimmed = note.trim()
  const tooLong = trimmed.length > NOTE_MAX_LENGTH
  const noteValid = trimmed.length >= NOTE_MIN_LENGTH && !tooLong

  return (
    <ConfirmModal
      open
      title="미입금"
      description="입금 내역이 없어 환불 없이 종결합니다. 환불 반려가 아니라 받은 돈이 없다는 뜻이며, 요청은 취소로 남습니다."
      confirmLabel="미입금"
      confirmVariant="destructive"
      disabled={pending || !noteValid}
      error={error}
      onClose={pending ? () => {} : onClose}
      onConfirm={() => onConfirm(trimmed)}
    >
      <div className="or-panel">
        <div className="or-kv-row">
          <span className="or-kv-label">요청</span>
          <span className="or-kv-value">요청 #{proposalId}</span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">환불 예정 금액</span>
          <span className="or-kv-value">{formatAmount(amount)}</span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">처리 여부</span>
          <span className="or-transition">
            <StatusBadge label="확인 필요" shape="pill" />
            <span className="or-transition-arrow">→</span>
            <span className="or-flag-off">해당 사항 없음</span>
          </span>
        </div>
      </div>

      <label className="or-field">
        <span className="or-field-label">관리자 메모 (필수)</span>
        <textarea
          className="or-textarea"
          value={note}
          disabled={pending}
          placeholder="입금이 없다고 판단한 근거를 남겨주세요."
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <p className="or-help-text">
        {tooLong
          ? `메모는 ${NOTE_MAX_LENGTH}자를 넘을 수 없습니다. (현재 ${trimmed.length}자)`
          : `근거를 남겨야 종결할 수 있습니다. (${NOTE_MAX_LENGTH}자 이내)`}
      </p>
    </ConfirmModal>
  )
}
