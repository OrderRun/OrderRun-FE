// UI 개발용 임시 데이터. 서버 계약/Domain 모델이 아니며 연동 시 이 디렉토리를 통째로 삭제한다.

import type { DemoUser } from './demoTypes'

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'U-1042',
    name: '강태오',
    createdAt: '2026-08-20 09:14',
    missionCount: 12,
  },
  {
    id: 'U-1038',
    name: '진태현',
    createdAt: '2026-08-18 15:30',
    missionCount: 3,
  },
  {
    id: 'U-1021',
    name: '한지우',
    createdAt: '2026-08-10 11:02',
    missionCount: 0,
  },
  {
    id: 'U-998',
    name: '탈퇴한 사용자',
    createdAt: '2026-07-22 08:47',
    missionCount: 7,
  },
]
