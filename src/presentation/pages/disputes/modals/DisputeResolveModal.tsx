import { useState } from 'react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { StatusBadge } from '../../../components/StatusBadge'
import type { MissionResolution } from '../../../../domain/status/missionStatus'

/**
 * 분쟁 처리 결과는 서버의 `MissionResolution`(`COMPLETED`/`FAILED`)이다.
 * 한글 라벨 → enum 변환을 화면 밖으로 미루지 않고 여기서 끝내, 호출부가
 * 한글 문자열로 상태 전이를 판단하지 않게 한다.
 */
interface OutcomeOption {
  value: MissionResolution
  label: string
  /** 이 결과로 종결됐을 때 요청·지원·미션이 갖게 될 상태 라벨. */
  nextStatusLabel: string
}

const OUTCOMES: OutcomeOption[] = [
  { value: 'COMPLETED', label: '미션 완료', nextStatusLabel: '완료' },
  { value: 'FAILED', label: '미션 취소', nextStatusLabel: '취소' },
]

interface CascadeTarget {
  label: string
  id: string
  currentStatusLabel: string
}

interface DisputeResolveModalProps {
  open: boolean
  disputeId: string
  targets: CascadeTarget[]
  pending: boolean
  error: string | null
  onClose: () => void
  onConfirm: (outcome: MissionResolution, note: string) => void
  onReject: (note: string) => void
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
  pending,
  error,
  onClose,
  onConfirm,
  onReject,
}: DisputeResolveModalProps) {
  const [outcome, setOutcome] = useState<OutcomeOption | null>(null)
  const [note, setNote] = useState('')

  return (
    <Modal
      open
      title="분쟁 처리 결과"
      // 처리 중에는 닫지 않는다(결과와 오류를 놓치지 않게).
      onClose={pending ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" disabled={pending} onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => onReject(note.trim())}
          >
            반려
          </Button>
          <Button
            variant="primary"
            disabled={pending || outcome === null}
            onClick={() => {
              if (outcome !== null) {
                onConfirm(outcome.value, note.trim())
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
            key={option.value}
            className={`or-choice${outcome?.value === option.value ? ' is-checked' : ''}`}
          >
            <input
              type="radio"
              name="dispute-outcome"
              value={option.value}
              checked={outcome?.value === option.value}
              disabled={pending}
              onChange={() => setOutcome(option)}
            />
            {option.label}
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
                  <StatusBadge label={target.currentStatusLabel} />
                  <span className="or-transition-arrow">→</span>
                  <StatusBadge label={outcome.nextStatusLabel} />
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
          disabled={pending}
          placeholder="처리 근거나 확인한 내용을 남겨주세요."
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      {error === null ? null : (
        <p className="or-error-text" role="alert">
          {error}
        </p>
      )}
    </Modal>
  )
}
