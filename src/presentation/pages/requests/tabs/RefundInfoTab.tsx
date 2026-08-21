import { useState } from 'react'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { InfoCard } from '../../../components/InfoCard'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatAmount } from '../../../components/formatters'
import type { DemoProcessStatus, DemoRefund } from '../../../demo/demoTypes'
import { RefundProcessModal } from '../modals/RefundProcessModal'

interface RefundInfoTabProps {
  refund: DemoRefund | undefined
  requestStatus: string
  /** 환불이 완료되면 요청도 취소로 바뀐다. */
  onRequestCancel: () => void
}

export function RefundInfoTab({
  refund,
  requestStatus,
  onRequestCancel,
}: RefundInfoTabProps) {
  if (!refund) {
    return (
      <EmptyState
        message="환불 요청이 없습니다."
        hint="요청이 취소되거나 분쟁이 환불로 처리되면 이곳에 표시됩니다."
      />
    )
  }

  return (
    <RefundInfoView
      key={refund.proposalId}
      refund={refund}
      requestStatus={requestStatus}
      onRequestCancel={onRequestCancel}
    />
  )
}

function RefundInfoView({
  refund,
  requestStatus,
  onRequestCancel,
}: {
  refund: DemoRefund
  requestStatus: string
  onRequestCancel: () => void
}) {
  const [status, setStatus] = useState<DemoProcessStatus>(refund.status)
  const [processedAt, setProcessedAt] = useState(refund.processedAt)
  const [adminNote, setAdminNote] = useState(refund.adminNote)
  const [processOpen, setProcessOpen] = useState(false)

  const nowStamp = () =>
    new Date().toISOString().slice(0, 16).replace('T', ' ')

  const alreadyProcessed = status !== '미처리'

  const handleProcess = (note: string) => {
    setStatus('처리 완료')
    setProcessedAt(nowStamp())
    if (note !== '') {
      setAdminNote(note)
    }
    onRequestCancel()
    setProcessOpen(false)
  }

  const handleReject = (reason: string) => {
    setStatus('반려')
    setProcessedAt(nowStamp())
    if (reason !== '') {
      setAdminNote(reason)
    }
    setProcessOpen(false)
  }

  return (
    <>
      <InfoCard
        title="환불 정보"
        actions={
          alreadyProcessed ? undefined : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setProcessOpen(true)}
            >
              환불 처리
            </Button>
          )
        }
        items={[
          { label: '환불 상태', value: <StatusBadge label={status} shape="pill" /> },
          { label: '환불 금액', value: formatAmount(refund.amount) },
          { label: '환불 사유', value: refund.reason },
          { label: '요청일', value: refund.requestedAt, newRow: true },
          {
            label: '처리일',
            value: processedAt ?? (
              <span className="or-flag-off">아직 처리되지 않았습니다.</span>
            ),
          },
          {
            label: '관리자 메모',
            value:
              adminNote === '' ? (
                <span className="or-flag-off">작성된 메모가 없습니다.</span>
              ) : (
                adminNote
              ),
          },
        ]}
      />

      <RefundProcessModal
        open={processOpen}
        proposalId={refund.proposalId}
        amount={refund.amount}
        requestStatus={requestStatus}
        refundAccount={refund.refundAccount}
        accountHolderName={refund.accountHolderName}
        onClose={() => setProcessOpen(false)}
        onConfirm={handleProcess}
        onReject={handleReject}
      />
    </>
  )
}
