import { useState } from 'react'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatAmount } from '../../../components/formatters'

interface RefundProcessModalProps {
  open: boolean
  proposalId: string
  amount: number
  requestStatusLabel: string
  /** 서버가 계좌를 내려주지 않으면 null이다. 값을 지어내지 않는다. */
  refundAccount: string | null
  accountHolderName: string | null
  pending: boolean
  error: string | null
  onClose: () => void
  onConfirm: (adminNote: string) => void
  onReject: (adminNote: string) => void
}

export function RefundProcessModal(props: RefundProcessModalProps) {
  if (!props.open) {
    return null
  }
  return <RefundProcessModalContent {...props} />
}

function RefundProcessModalContent({
  proposalId,
  amount,
  requestStatusLabel,
  refundAccount,
  accountHolderName,
  pending,
  error,
  onClose,
  onConfirm,
  onReject,
}: RefundProcessModalProps) {
  const [adminNote, setAdminNote] = useState('')
  const alreadyCancelled = requestStatusLabel === '취소'

  return (
    <ConfirmModal
      open
      title="환불 처리"
      description={
        alreadyCancelled
          ? '이미 취소된 요청의 환불입니다. 완료 또는 반려 처리해도 요청 상태는 그대로입니다.'
          : '환불을 완료 처리하면 요청도 취소로 변경됩니다. 반려하면 요청 상태는 그대로입니다.'
      }
      confirmLabel="환불 완료"
      rejectLabel="반려"
      disabled={pending}
      error={error}
      onReject={() => onReject(adminNote.trim())}
      onClose={pending ? () => {} : onClose}
      onConfirm={() => onConfirm(adminNote.trim())}
    >
      <div className="or-panel">
        <div className="or-kv-row">
          <span className="or-kv-label">요청</span>
          <span className="or-kv-value">요청 #{proposalId}</span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">환불 금액</span>
          <span className="or-kv-value">{formatAmount(amount)}</span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">요청 상태</span>
          {alreadyCancelled ? (
            <StatusBadge label={requestStatusLabel} />
          ) : (
            <span className="or-transition">
              <StatusBadge label={requestStatusLabel} />
              <span className="or-transition-arrow">→</span>
              <StatusBadge label="취소" />
            </span>
          )}
        </div>
      </div>

      <div className="or-panel">
        <div className="or-kv-row">
          <span className="or-kv-label">환불 계좌</span>
          <span className="or-kv-value">
            {refundAccount ?? <span className="or-flag-off">해당 없음</span>}
          </span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">예금주명</span>
          <span className="or-kv-value">
            {accountHolderName ?? <span className="or-flag-off">해당 없음</span>}
          </span>
        </div>
      </div>

      <label className="or-field">
        <span className="or-field-label">관리자 메모 (선택)</span>
        <textarea
          className="or-textarea"
          value={adminNote}
          disabled={pending}
          placeholder="환불 근거나 확인한 내용을 남겨주세요."
          onChange={(event) => setAdminNote(event.target.value)}
        />
      </label>
    </ConfirmModal>
  )
}
