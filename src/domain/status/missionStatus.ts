// Mission lifecycle status.
// Verbatim from `components.schemas.MissionStatus` in docs/api-spec/openapi.json.
export const MISSION_STATUSES = [
  'STARTED',
  'DISPUTED',
  'COMPLETED',
  'PAID',
  'FAILED',
] as const

export type MissionStatus = (typeof MISSION_STATUSES)[number]

// Verbatim from `components.schemas.MissionResolution`.
// 분쟁 처리 결과이자 미션 강제 종료 결과로 같은 두 값을 쓴다.
export const MISSION_RESOLUTIONS = ['COMPLETED', 'FAILED'] as const

export type MissionResolution = (typeof MISSION_RESOLUTIONS)[number]
