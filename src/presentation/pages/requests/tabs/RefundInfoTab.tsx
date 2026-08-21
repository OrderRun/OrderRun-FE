import { EmptyState } from '../../../components/EmptyState'
import { InfoCard } from '../../../components/InfoCard'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatAmount } from '../../../components/formatters'
import type { DemoRefund } from '../../../demo/demoTypes'

interface RefundInfoTabProps {
  refund: DemoRefund | undefined
}

export function RefundInfoTab({ refund }: RefundInfoTabProps) {
  if (!refund) {
    return (
      <EmptyState
        message="환불 요청이 없습니다."
        hint="요청이 취소되거나 분쟁이 환불로 처리되면 이곳에 표시됩니다."
      />
    )
  }

  return (
    <InfoCard
      title="환불 정보"
      items={[
        { label: '환불 상태', value: <StatusBadge label={refund.status} /> },
        { label: '환불 금액', value: formatAmount(refund.amount) },
        { label: '환불 사유', value: refund.reason },
        { label: '요청일', value: refund.requestedAt },
        {
          label: '처리일',
          value: refund.processedAt ?? (
            <span className="or-flag-off">아직 처리되지 않았습니다.</span>
          ),
        },
        {
          label: '관리자 메모',
          value:
            refund.adminNote === '' ? (
              <span className="or-flag-off">작성된 메모가 없습니다.</span>
            ) : (
              refund.adminNote
            ),
        },
      ]}
    />
  )
}
