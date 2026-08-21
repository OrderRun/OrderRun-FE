// UI 개발용 Proposal 신고 임시 데이터. 서버 DTO가 아니며 API 연동 시 경계에서 변환한다.

import type { DemoProposalReport } from './demoTypes'

/** 신고는 지원자를 선택하기 전인 '대기중' 요청에만 접수될 수 있다. */
export const DEMO_PROPOSAL_REPORTS: DemoProposalReport[] = [
  {
    reportId: 'R-204',
    targetType: 'Proposal',
    proposalId: 'P-1033',
    reporterId: 'U-482',
    reasonQuestionText: '부적절한 요청 내용이 포함되어 있어요.',
    detailReason: '타인의 개인정보를 요청 본문에 노출했습니다.',
    reportedAt: '2026-08-21 11:18',
    reportStatus: '미처리',
    proposalStatus: '대기중',
  },
  {
    reportId: 'R-203',
    targetType: 'Proposal',
    proposalId: 'P-1033',
    reporterId: 'U-355',
    reasonQuestionText: '거래 내용이 의심스러워요.',
    detailReason: '외부 메신저로 유도했습니다.',
    reportedAt: '2026-08-21 10:52',
    reportStatus: '미처리',
    proposalStatus: '대기중',
  },
  {
    reportId: 'R-202',
    targetType: 'Proposal',
    proposalId: 'P-1033',
    reporterId: 'U-198',
    reasonQuestionText: '중복된 요청이에요.',
    reportedAt: '2026-08-21 09:31',
    reportStatus: '처리 완료',
    proposalStatus: '대기중',
  },
  {
    reportId: 'R-201',
    targetType: 'Proposal',
    proposalId: 'P-1032',
    reporterId: 'U-315',
    reasonQuestionText: '거래 내용이 의심스러워요.',
    detailReason: '요청 완료 전 외부 계좌로 선입금을 요구했습니다.',
    reportedAt: '2026-08-20 18:42',
    reportStatus: '미처리',
    proposalStatus: '대기중',
  },
]
