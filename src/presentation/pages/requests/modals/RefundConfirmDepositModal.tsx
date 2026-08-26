import { ConfirmModal } from '../../../components/ConfirmModal'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatAmount } from '../../../components/formatters'

/**
 * 입금 대조 결과 **입금이 확인됐을 때** 누르는 모달. 서버 스펙에 요청 본문이
 * 없어 메모 입력이 없다. 이 처리 자체가 이체가 아니라, 환불 대상임을 확정하는
 * 단계다(이체는 이어서 '환불 처리'로 한다).
 */
interface RefundConfirmDepositModalProps {
  open: boolean
  proposalId: string
  amount: number
  /** 서버가 계좌를 내려주지 않으면 null이다. 값을 지어내지 않는다. */
  refundAccount: string | null
  refundAccountHolder: string | null
  pending: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
  onRequestVoid: () => void
}

export function RefundConfirmDepositModal({
  open,
  proposalId,
  amount,
  refundAccount,
  refundAccountHolder,
  pending,
  error,
  onClose,
  onConfirm,
  onRequestVoid,
}: RefundConfirmDepositModalProps) {
  if (!open) {
    return null
  }

  return (
    <ConfirmModal
      open
      title="입금 확인"
      description="입금 내역이 확인되었을 때만 진행해주세요. 요청이 환불 대기로 바뀌며, 실제 이체는 이어서 '환불 처리'로 진행합니다."
      confirmLabel="입금 확인"
      rejectLabel="미입금"
      onReject={onRequestVoid}
      disabled={pending}
      error={error}
      onClose={pending ? () => {} : onClose}
      onConfirm={onConfirm}
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
          <span className="or-kv-label">환불 계좌</span>
          <span className="or-kv-value">
            {refundAccount ?? <span className="or-flag-off">해당 없음</span>}
          </span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">예금주명</span>
          <span className="or-kv-value">
            {refundAccountHolder ?? <span className="or-flag-off">해당 없음</span>}
          </span>
        </div>
        <div className="or-kv-row">
          <span className="or-kv-label">처리 여부</span>
          <span className="or-transition">
            <StatusBadge label="확인 필요" shape="pill" />
            <span className="or-transition-arrow">→</span>
            <StatusBadge label="미처리" shape="pill" />
          </span>
        </div>
      </div>
    </ConfirmModal>
  )
}
