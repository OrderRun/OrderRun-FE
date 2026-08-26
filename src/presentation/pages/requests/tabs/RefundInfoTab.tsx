import { useState } from 'react'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { InfoCard } from '../../../components/InfoCard'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatAmount } from '../../../components/formatters'
import type { ActionState, RefundDetailView } from '../../../models/detailViews'
import { RefundConfirmDepositModal } from '../modals/RefundConfirmDepositModal'
import { RefundProcessModal } from '../modals/RefundProcessModal'
import { RefundVoidModal } from '../modals/RefundVoidModal'

interface RefundInfoTabProps {
  refund: RefundDetailView | null
  action: ActionState
  /** 환불 완료는 서버가 연결된 요청을 취소로 종결한다. 화면은 재조회 결과만 그린다. */
  onProcess: (adminNote: string) => Promise<void>
  /** 입금 대조 결과 입금이 확인됨. 환불이 `PENDING`으로 확정된다. */
  onConfirmDeposit: () => Promise<void>
  /** 입금 대조 결과 입금이 없음. 환불 없이 종결한다. */
  onVoid: (adminNote: string) => Promise<void>
}

export function RefundInfoTab({
  refund,
  action,
  onProcess,
  onConfirmDeposit,
  onVoid,
}: RefundInfoTabProps) {
  const [processOpen, setProcessOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)

  if (refund === null) {
    return (
      <EmptyState
        message="환불 요청이 없습니다."
        hint="요청이 취소되거나 분쟁이 환불로 처리되면 이곳에 표시됩니다."
      />
    )
  }

  // 실패는 `action.error`로 이미 모달에 그려진다. 모달은 열린 채로 둔다.
  const ignoreFailure = () => {}
  const openModal = (open: (value: boolean) => void) => () => {
    action.reset()
    open(true)
  }
  const actionDisabled = action.disabled || action.pending
  const disabledNotice =
    action.disabledReason === null ? null : (
      <span className="or-help-text">{action.disabledReason}</span>
    )

  return (
    <>
      <InfoCard
        title="환불 정보"
        actions={
          refund.action === 'none' ? undefined : refund.action === 'complete' ? (
            <>
              <Button
                variant="primary"
                size="sm"
                disabled={actionDisabled}
                onClick={openModal(setProcessOpen)}
              >
                환불 처리
              </Button>
              {disabledNotice}
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                disabled={actionDisabled}
                onClick={openModal(setDepositOpen)}
              >
                입금 확인
              </Button>
              {disabledNotice}
            </>
          )
        }
        items={[
          {
            label: '환불 상태',
            value:
              refund.statusLabel === null ? (
                <span className="or-flag-off">해당 사항 없음</span>
              ) : (
                <StatusBadge label={refund.statusLabel} shape="pill" />
              ),
          },
          { label: '환불 금액', value: formatAmount(refund.amount) },
          { label: '환불 사유', value: refund.reason },
          {
            label: '상세 사유',
            value: refund.reasonDetail ?? (
              <span className="or-flag-off">등록된 상세 사유가 없습니다.</span>
            ),
          },
          { label: '요청일', value: refund.requestedAt, newRow: true },
          {
            label: '처리일',
            value: refund.processedAt ?? (
              <span className="or-flag-off">아직 처리되지 않았습니다.</span>
            ),
          },
          {
            label: '관리자 메모',
            value: refund.adminNote ?? (
              <span className="or-flag-off">작성된 메모가 없습니다.</span>
            ),
          },
        ]}
      />

      <RefundProcessModal
        open={processOpen}
        proposalId={refund.proposalId}
        amount={refund.amount}
        requestStatusLabel={refund.requestStatusLabel}
        refundAccount={refund.refundAccount}
        accountHolderName={refund.refundAccountHolder}
        pending={action.pending}
        error={action.error}
        onClose={() => {
          action.reset()
          setProcessOpen(false)
        }}
        onConfirm={(note) => {
          onProcess(note).then(() => setProcessOpen(false), ignoreFailure)
        }}
      />

      <RefundConfirmDepositModal
        open={depositOpen}
        proposalId={refund.proposalId}
        amount={refund.amount}
        refundAccount={refund.refundAccount}
        refundAccountHolder={refund.refundAccountHolder}
        pending={action.pending}
        error={action.error}
        onClose={() => {
          action.reset()
          setDepositOpen(false)
        }}
        onConfirm={() => {
          onConfirmDeposit().then(() => setDepositOpen(false), ignoreFailure)
        }}
        onRequestVoid={() => {
          action.reset()
          setDepositOpen(false)
          setVoidOpen(true)
        }}
      />

      <RefundVoidModal
        open={voidOpen}
        proposalId={refund.proposalId}
        amount={refund.amount}
        pending={action.pending}
        error={action.error}
        onClose={() => {
          action.reset()
          setVoidOpen(false)
        }}
        onConfirm={(note) => {
          onVoid(note).then(() => setVoidOpen(false), ignoreFailure)
        }}
      />
    </>
  )
}
