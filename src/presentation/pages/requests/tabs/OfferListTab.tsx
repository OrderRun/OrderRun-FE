import { useState } from 'react'
import { Button } from '../../../components/Button'
import { DataTable } from '../../../components/DataTable'
import { InfoCard } from '../../../components/InfoCard'
import { Modal } from '../../../components/Modal'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatAmount } from '../../../components/formatters'
import type { DemoOffer } from '../../../demo/demoTypes'

interface OfferListTabProps {
  offers: DemoOffer[]
  selectedOfferId: string | null
}

export function OfferListTab({ offers, selectedOfferId }: OfferListTabProps) {
  const [detailOffer, setDetailOffer] = useState<DemoOffer | null>(null)

  return (
    <>
      <DataTable
        rows={offers}
        rowKey={(offer) => offer.offerId}
        emptyMessage="등록된 지원이 없습니다."
        emptyHint="꼬붕이 지원하면 이곳에 표시됩니다."
        onRowClick={(offer) => setDetailOffer(offer)}
        isRowHighlighted={(offer) => offer.offerId === selectedOfferId}
        columns={[
          {
            key: 'offerId',
            header: '지원 ID',
            width: '100px',
            render: (offer) => <span className="or-cell-id">{offer.offerId}</span>,
          },
          {
            key: 'kkobung',
            header: '꼬붕',
            width: '110px',
            render: (offer) => offer.kkobungName,
          },
          {
            key: 'amount',
            header: '지원 금액',
            width: '110px',
            align: 'right',
            render: (offer) => (
              <span className="or-cell-amount">{formatAmount(offer.amount)}</span>
            ),
          },
          {
            key: 'status',
            header: '상태',
            width: '90px',
            render: (offer) => <StatusBadge label={offer.status} />,
          },
          {
            key: 'appliedAt',
            header: '신청일',
            width: '140px',
            render: (offer) => (
              <span className="or-cell-muted">{offer.appliedAt}</span>
            ),
          },
          {
            key: 'selected',
            header: '선택 여부',
            width: '100px',
            render: (offer) =>
              offer.offerId === selectedOfferId ? (
                <StatusBadge label="선택됨" />
              ) : (
                <span className="or-flag-off">미선택</span>
              ),
          },
          {
            key: 'detail',
            header: '상세',
            width: '80px',
            align: 'right',
            render: (offer) => (
              <Button
                size="sm"
                onClick={(event) => {
                  event.stopPropagation()
                  setDetailOffer(offer)
                }}
              >
                상세
              </Button>
            ),
          },
        ]}
      />

      <Modal
        open={detailOffer !== null}
        title="지원 상세"
        onClose={() => setDetailOffer(null)}
        footer={
          <Button variant="secondary" onClick={() => setDetailOffer(null)}>
            닫기
          </Button>
        }
      >
        {detailOffer ? (
          <>
            <InfoCard
              items={[
                { label: '지원 ID', value: detailOffer.offerId },
                { label: '꼬붕', value: detailOffer.kkobungName },
                { label: '지원 금액', value: formatAmount(detailOffer.amount) },
                {
                  label: '지원 상태',
                  value: <StatusBadge label={detailOffer.status} />,
                },
                { label: '신청일', value: detailOffer.appliedAt },
                {
                  label: '선택 여부',
                  value:
                    detailOffer.offerId === selectedOfferId ? '선택됨' : '미선택',
                },
              ]}
            />
            <div className="or-field">
              <span className="or-field-label">지원 메시지</span>
              <p className="or-help-text">{detailOffer.message}</p>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  )
}
