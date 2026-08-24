import { useState } from 'react'
import { Button } from '../../../components/Button'
import { ActorName } from '../../../components/ActorName'
import { DataTable } from '../../../components/DataTable'
import { InfoCard } from '../../../components/InfoCard'
import { Modal } from '../../../components/Modal'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatAmount } from '../../../components/formatters'
import type { OfferRow } from '../../../models/rows'

interface OfferListTabProps {
  offers: OfferRow[]
  selectedOfferId: string | null
}

/**
 * 지원 목록. `AdminOfferSummaryResponse`에는 지원 메시지가 없어(스펙 확인)
 * 상세 모달에서도 메시지를 그리지 않는다.
 */
export function OfferListTab({ offers, selectedOfferId }: OfferListTabProps) {
  const [detailOffer, setDetailOffer] = useState<OfferRow | null>(null)

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
            render: (offer) => (
              <ActorName
                name={offer.kkobungName}
                id={offer.kkobungId}
                variant="cell"
              />
            ),
          },
          {
            key: 'status',
            header: '상태',
            width: '90px',
            render: (offer) => <StatusBadge label={offer.statusLabel} />,
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
              offer.selected ? (
                <StatusBadge label="선택됨" shape="pill" />
              ) : (
                <span className="or-flag-off">미선택</span>
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
          <InfoCard
            items={[
              { label: '지원 ID', value: detailOffer.offerId },
              {
                label: '꼬붕',
                value: (
                  <ActorName
                    name={detailOffer.kkobungName}
                    id={detailOffer.kkobungId}
                    variant="plain"
                  />
                ),
              },
              {
                label: '지원 상태',
                value: <StatusBadge label={detailOffer.statusLabel} />,
              },
              { label: '금액', value: formatAmount(detailOffer.amount) },
              { label: '신청일', value: detailOffer.appliedAt, newRow: true },
              {
                label: '선택 여부',
                value: detailOffer.selected ? '선택됨' : '미선택',
              },
            ]}
          />
        ) : null}
      </Modal>
    </>
  )
}
