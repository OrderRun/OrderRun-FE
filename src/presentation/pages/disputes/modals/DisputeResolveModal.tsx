import { useState } from 'react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { StatusBadge } from '../../../components/StatusBadge'
import type { DemoStatusLabel } from '../../../demo/demoTypes'

export type DisputeOutcome = '미션 완료' | '미션 취소'

interface CascadeTarget {
  label: string
  id: string
  currentStatus: DemoStatusLabel
}

interface DisputeResolveModalProps {
  open: boolean
  disputeId: string
  targets: CascadeTarget[]
  onClose: () => void
  onConfirm: (outcome: DisputeOutcome, note: string) => void
}

const OUTCOMES: DisputeOutcome[] = ['미션 완료', '미션 취소']

function nextStatusOf(outcome: DisputeOutcome): DemoStatusLabel {
  return outcome === '미션 완료' ? '완료' : '취소'
}

export function DisputeResolveModal(props: DisputeResolveModalProps) {
  if (!props.open) {
    return null
  }
  return <DisputeResolveModalContent {...props} />
}

function DisputeResolveModalContent({
  disputeId,
  targets,
  onClose,
  onConfirm,
}: DisputeResolveModalProps) {
  const [outcome, setOutcome] = useState<DisputeOutcome | null>(null)
  const [note, setNote] = useState('')

  return (
    <Modal
      open
      title="분쟁 처리 결과"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            disabled={outcome === null}
            onClick={() => {
              if (outcome !== null) {
                onConfirm(outcome, note.trim())
              }
            }}
          >
            분쟁 처리 완료
          </Button>
        </>
      }
    >
      <p className="or-modal-desc">분쟁 #{disputeId}의 처리 결과를 선택해주세요.</p>

      <div className="or-choice-list">
        {OUTCOMES.map((option) => (
          <label
            key={option}
            className={`or-choice${outcome === option ? ' is-checked' : ''}`}
          >
            <input
              type="radio"
              name="dispute-outcome"
              value={option}
              checked={outcome === option}
              onChange={() => setOutcome(option)}
            />
            {option}
          </label>
        ))}
      </div>

      <div className="or-panel">
        {outcome === null ? (
          <p className="or-help-text">
            처리 결과를 선택하면 함께 변경되는 상태를 확인할 수 있습니다.
          </p>
        ) : (
          <>
            <p className="or-help-text">아래 상태가 함께 변경됩니다.</p>
            {targets.map((target) => (
              <div className="or-kv-row" key={target.label}>
                <span className="or-kv-label">
                  {target.label} #{target.id}
                </span>
                <span className="or-transition">
                  <StatusBadge label={target.currentStatus} />
                  <span className="or-transition-arrow">→</span>
                  <StatusBadge label={nextStatusOf(outcome)} />
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <label className="or-field">
        <span className="or-field-label">관리자 메모 (선택)</span>
        <textarea
          className="or-textarea"
          value={note}
          placeholder="처리 근거나 확인한 내용을 남겨주세요."
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
    </Modal>
  )
}
