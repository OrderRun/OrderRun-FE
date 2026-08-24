import { formatShortId } from './formatters'

interface ActorNameProps {
  /** 행위자 이름. 서버가 nullable로 주며 없으면 ID로 대신 그린다. */
  name: string | null
  /** 이름이 없을 때 대신 그릴 ID. 원천에 ID조차 없으면 null이다. */
  id: string | null
  /**
   * 축약 ID를 어디에 그리는지. 표 칸(`cell`)만 다른 ID 칸과 같은 서체
   * (`or-cell-id`)를 쓰고, 상세 카드(`plain`)는 본문 서체를 유지한다.
   * 기본값을 두지 않는 이유: 호출부가 맥락을 말하지 않고 조용히 틀린 서체로
   * 그리는 일을 막는다.
   */
  variant: 'cell' | 'plain'
}

/**
 * 행위자(행님·꼬붕·신청자·신고자)를 그리는 단 하나의 표현. 이름이 없으면
 * (탈퇴한 사용자 등) 없는 이름을 만들어내지 않고 ID를 축약해 대신 그리되,
 * 잘린 값을 진짜 ID로 오해하지 않도록 `title`에 전체 값을 건다. 이름도 ID도
 * 없는 원천(수행비 지급 목록의 행님)만 '해당 없음'이다.
 *
 * 빈 문자열 이름은 변환 경계(`models/optionalText.ts`)가 이미 null로 걸러 둔다.
 */
export function ActorName({ name, id, variant }: ActorNameProps) {
  if (name !== null) {
    return <>{name}</>
  }
  if (id !== null) {
    return (
      <span className={variant === 'cell' ? 'or-cell-id' : undefined} title={id}>
        {formatShortId(id)}
      </span>
    )
  }
  return <span className="or-flag-off">해당 없음</span>
}
