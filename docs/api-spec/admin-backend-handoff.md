# 관리자 API 백엔드 전달 문서

Source of Truth: [`admin-api-contract.md`](./admin-api-contract.md) · 대상: 백엔드 구현자

> ## 상태: 완료 (2026-08-22)
>
> 이 문서가 요청한 내용은 **백엔드가 전부 구현해 스테이징(`https://staging-api.kkobung-dan.store`)에 반영**했다.
> 관리자 operation 6개 → **28개**. 아래 본문은 요청 당시의 기록으로 남긴다.
>
> 실제 구현된 스펙은 `docs/api-spec/openapi.json`과
> [`admin-api-contract.md` §6](./admin-api-contract.md)를 본다. **연동 작업은 그쪽을 기준으로 한다.**

## 요청 대비 반영 결과

| 요청 | 결과 |
|---|---|
| 기존 API 수정 4건 | ✅ 전부 반영 |
| 신규 endpoint 17건 | ✅ 전부 반영 (경로·쿼리·필드까지 일치) |
| admin `security` 선언 | ✅ 27개 전부 `HTTPBearer` (로그인만 예외) |
| 신규 `ErrorCode` | ✅ 6개 추가 |
| 추가로 구현된 것 | `POST /v1/admin/auth/login`, `/v1/admin/missions/*` 5개 |
| 삭제된 것 | `POST /v1/admin/offer/{offer_id}/resolve` |

## 결정 12건 처리 결과

| ID | 항목 | 결과 |
|---|---|---|
| D1 | Mission 도메인 | **존재.** `/v1/admin/missions/*` 4개 구현. `MissionStatus` 6값 |
| D3 | 관리자 인증 | **해소.** `POST /v1/admin/auth/login` + Bearer |
| D4 | Offer 금액 | **해소.** `amount` = Proposal `errandFee` |
| D6 | pending-payment | **해소.** 유지 + deprecated, `page`/`size`로 정렬 |
| D8 | offer resolve | **해소.** 해당 endpoint 삭제, dispute 경로로 단일화 |
| D10 | Dispute 처리 상태 | **해소.** `dispute_evidences` 확장 |
| D12 | 비마스킹 계좌 | **해소.** refund/payout 상세에서 제공 |
| D7 | 환불 cardinality | **해소.** Mission 파생, `refundId` = 미션 ID |
| D11 | adminNote | **해소.** `AdminNoteRequest`를 5개 endpoint가 공유 |
| D9 | 신고 승인 cascade | **답변됨.** `REPORTED`로 전이 (`CANCELLED` 아님) → **FE 수정 필요** |
| D5 | `depositorName` | **부분 해소.** 계좌 3필드는 제공, `depositorName`은 항상 `null` → **제품 결정 필요** |
| D2 | 상태 매핑 | **미해결.** enum 변경 없음 → **FE 블로커** |

## 남은 항목

1. **D2 상태 매핑** — `ProposalStatus` 10값·`OfferStatus` 8값·`MissionStatus` 6값을 관리자 화면 라벨에 어떻게 대응시킬지. `RESOLVED`/`REPORTED`/`PAID`/`REFUNDED`는 대응 라벨이 없다
2. **D5 `depositorName`** — 값을 만드는 흐름을 넣을지, UI에서 뺄지
3. **D9 FE 수정** — `ReportInfoTab.tsx`의 "요청도 취소로 변경됩니다" 안내가 사실과 다름
4. **지원 메시지** — `AdminOfferSummaryResponse`에 `message`가 없는데 UI는 지원 메시지를 표시함. 서버 추가 또는 UI 제거 필요
5. **Mission vs Refund/Payout endpoint 중복** — 같은 상태를 두 경로로 바꿀 수 있음. FE는 refund/payout 쪽으로 통일 예정

---

<details>
<summary><b>이하 원본 요청서 (2026-08-22 작성 · 역사적 기록)</b></summary>

# 1. Existing API Changes

## 1.1 POST /v1/admin/proposal/{proposal_id}/confirm-payment — **수정**

**현재 상태**
- Request Body 없음
- Response `ApiResponse<ProposalResponse>`

**필요한 변경**
- Request Body 신설

**Request 변경**
```
AdminConfirmPaymentRequest {
  openChatUrl: string      // 필수. http:// 또는 https:// 로 시작
}
```

**Response 변경**
- 없음 (`ProposalResponse` 유지)

**비즈니스 동작**
- 입금 확인과 동시에 오픈채팅방 URL을 Proposal에 저장한다. 관리자 화면에서 URL은 필수 입력이므로, URL 없이 입금 확인만 하는 경로는 없다.
- 이미 입금 확인된 요청이면 `409 INVALID_STATUS`
- URL 형식 위반이면 `422 VALIDATION_ERROR`

---

## 1.2 GET /v1/admin/proposal/pending-payment — **수정 또는 폐기** *(BLOCKING · D6)*

**현재 상태**
- Query `skip` (기본 0) / `limit` (기본 100)
- **200 응답 스키마가 `{}`** — 반환 형태가 스펙에 정의되어 있지 않다

**필요한 변경**
- 응답 스키마 정의, 그리고 `skip`/`limit` → `page`/`size` 정렬

**Request 변경**
- `skip` → `page` (0-base, 기본 0), `limit` → `size` (1~100, 기본 20)

**Response 변경**
- `ApiResponse<PageResponse<AdminProposalSummaryResponse>>` (§2.1의 타입 재사용)

**비즈니스 동작**
- 이 endpoint의 기능은 신규 `GET /v1/admin/proposal?status=<입금대기>`로 완전히 대체 가능하다. **유지할지 폐기할지 결정이 필요하다 (D6).**
- 유지할 경우 **경로 충돌 주의**: `GET /v1/admin/proposal/{proposal_id}`(신규, §2.2)와 같은 세그먼트를 다툰다. `pending-payment` 리터럴 라우트를 `{proposal_id}` 라우트보다 먼저 등록해야 한다.

---

## 1.3 GET /v1/admin/proposal-reports — **수정**

**현재 상태**
- Query `status?: ProposalReportStatus`, `page`, `size`
- Response `ApiResponse<PageResponse<ProposalReportResponse>>`

**필요한 변경**
- Query 2개 추가, Response 필드 1개 추가

**Request 변경**
```
keyword?: string      // 신규. 매칭 대상: id, proposalId, reporterId, reasonQuestionText, detailReason
proposalId?: number   // 신규. 특정 요청의 신고만 조회
```

**Response 변경**
```
ProposalReportResponse 에 추가:
  proposalStatus: ProposalStatus   // 신고 대상 Proposal의 현재 상태
```

**비즈니스 동작**
- 변경 없음. 경로는 기존 복수형(`proposal-reports`)을 그대로 둔다.

---

## 1.4 POST /v1/admin/offer/{offer_id}/resolve — **방향 결정 필요** *(BLOCKING · D8)*

**현재 상태**
- Request Body 없음
- Response `ApiResponse<OfferResponse>`

**필요한 변경**
- 관리자 분쟁 처리는 **결과(완료/취소)** 와 **관리자 메모**를 함께 보내야 하는데, 현재 endpoint는 둘 다 전달할 수단이 없다.

**Request 변경**
- 미확정 — D8 참조

**Response 변경**
- 미확정 — D8 참조

**비즈니스 동작**
- 미확정. 아래 §2.3 Dispute endpoint로 대체할지, 이 경로에 body를 추가할지 결정 후 확정한다.

---

# 2. New APIs

Request/Response 필드는 `admin-api-contract.md` §6에 정의된 값을 그대로 사용한다. 여기에 없는 필드는 추가하지 않는다.

## 2.1 Proposal

### GET /v1/admin/proposal

**Purpose** — 관리자 요청 목록

**Query Parameter**
```
status?: ProposalStatus[]   // 반복 입력
keyword?: string            // 매칭 대상: id, ordererName
page?: number               // 0-base, 기본 0
size?: number               // 1~100, 기본 20
```

**Request Body** — 없음

**Response** — `PageResponse<AdminProposalSummaryResponse>`
```
id: number
ordererId: string
ordererName: string
errandFee: number
status: ProposalStatus
offerCount: number
createdAt: string
```

**Business Rule**
- `offerCount`는 해당 Proposal에 달린 Offer 수
- 정렬 파라미터 없음 (기존 전 API와 동일)

---

### GET /v1/admin/proposal/{proposal_id}

**Purpose** — 관리자 요청 상세

**Path Parameter** — `proposal_id: number`

**Request Body** — 없음

**Response** — `AdminProposalDetailResponse`
```
id: number
title: string
content: string
deadline: string
errandFee: number
ordererId: string
ordererName: string
ordererLevel: number
status: ProposalStatus
createdAt: string
openChatUrl: string | null
acceptedOfferId: number | null
acceptedRunnerName: string | null
depositorName: string | null        // D5 종속
depositAccount: string | null       // D5 종속. 플랫폼 입금 계좌
matchedAt: string | null
runnerConfirmedAt: string | null
ordererConfirmedAt: string | null
disputedAt: string | null
resolvedAt: string | null
```

**Business Rule**
- `acceptedOfferId` / `acceptedRunnerName`은 수락된 Offer가 있을 때만 채운다
- `depositorName` / `depositAccount`는 **D5 결정 후 확정** — 소유 도메인이 미정이다
- Error: 공통 + `404 PROPOSAL_NOT_FOUND`

---

### POST /v1/admin/proposal/{proposal_id}/cancel

**Purpose** — 관리자 요청 취소

**Path Parameter** — `proposal_id: number`

**Request Body** — `AdminProposalCancelRequest`
```
adminNote?: string | null    // 최대 500자
```

**Response** — `AdminProposalDetailResponse`

**Business Rule**
- Proposal 취소 + **연결된 Offer를 함께 취소한다 (cascade)**
- 기존 `POST /v1/proposal/{proposal_id}/cancel`(오더러용)과 **별개 endpoint**다. 권한 주체와 cascade 범위가 다르므로 재사용하지 않는다
- Error: 공통 + `409 PROPOSAL_NOT_CANCELLABLE`

---

## 2.2 Offer

### GET /v1/admin/offer

**Purpose** — 관리자 지원 목록. 전체 지원 조회와 특정 요청의 지원 조회를 모두 담당한다

**Query Parameter**
```
proposalId?: number
status?: OfferStatus[]      // 반복 입력
accepted?: boolean          // 수락 여부
hasDispute?: boolean        // 분쟁 존재 여부
keyword?: string            // 매칭 대상: id, proposalId, runnerName
page?: number
size?: number
```

**Request Body** — 없음

**Response** — `PageResponse<AdminOfferSummaryResponse>`
```
id: number
proposalId: number
runnerId: string
runnerName: string
runnerLevel: number
status: OfferStatus
accepted: boolean
hasDispute: boolean
message: string | null
createdAt: string
amount: number              // D4 종속 — 서버에 Offer 금액 개념이 있는지 미확정
```

**Business Rule**
- `hasDispute`는 해당 Offer에 분쟁이 접수되었는지 여부
- `amount`는 **D4 결정 후 확정**. 서버에 Offer 금액 개념이 없다면 필드를 뺀다
- 기존 `GET /v1/offer?proposalId=`(단건 배열, 페이지네이션 없음)와 별개다

---

## 2.3 Dispute

**전 endpoint가 D10(분쟁 처리 상태 모델)에 종속된다.** 현재 서버 `DisputeEvidence`에는 처리 상태·관리자 메모·대상자 정보가 없고 목록 조회 API도 없다.

### GET /v1/admin/dispute

**Purpose** — 관리자 분쟁 목록

**Query Parameter**
```
status?: DisputeProcessStatus[]   // 'PENDING' | 'RESOLVED' | 'REJECTED'
proposalId?: number
keyword?: string                  // 매칭 대상: id, proposalId, offerId, requesterName
page?: number
size?: number
```

**Request Body** — 없음

**Response** — `PageResponse<AdminDisputeSummaryResponse>`
```
id: number
proposalId: number
offerId: number
requesterId: string
requesterName: string
requesterRole: DisputeActorRole   // 'ORDERER' | 'RUNNER'
status: DisputeProcessStatus      // 'PENDING' | 'RESOLVED' | 'REJECTED'
createdAt: string
```

**Business Rule**
- `DisputeProcessStatus`는 Proposal/Offer의 진행 상태와 **다른 축**이다 (접수 건의 관리자 처리 여부)

---

### GET /v1/admin/dispute/{dispute_id}

**Purpose** — 관리자 분쟁 상세

**Path Parameter** — `dispute_id: number`

**Request Body** — 없음

**Response** — `AdminDisputeDetailResponse` = Summary 전 필드 +
```
targetId: string
targetName: string
targetRole: DisputeActorRole
surveyQuestionId: number
reason: string
adminNote: string | null
resolvedAt: string | null
```

**Business Rule**
- `requester`는 분쟁을 신청한 쪽, `target`은 신청 대상. 둘 다 이름과 역할이 필요하다
- Error: 공통 + `404 DISPUTE_EVIDENCE_NOT_FOUND`

---

### POST /v1/admin/dispute/{dispute_id}/resolve

**Purpose** — 분쟁 해결 처리

**Path Parameter** — `dispute_id: number`

**Request Body** — `AdminDisputeResolveRequest`
```
outcome: DisputeOutcome       // 필수. 'COMPLETED' | 'CANCELLED'
adminNote?: string | null
```

**Response** — `AdminDisputeDetailResponse`

**Business Rule**
- 분쟁 → `RESOLVED`
- `outcome`에 따라 **연결된 Proposal·Offer를 일괄 전이**시킨다
  - `COMPLETED` → 완료 계열 상태
  - `CANCELLED` → 취소 계열 상태
- 정확한 목표 상태값은 D2(상태 매핑) 확정 후 서버가 결정한다
- Error: 공통 + `409 INVALID_STATUS`

---

### POST /v1/admin/dispute/{dispute_id}/reject

**Purpose** — 분쟁 반려

**Path Parameter** — `dispute_id: number`

**Request Body** — `AdminDisputeRejectRequest`
```
adminNote?: string | null
```

**Response** — `AdminDisputeDetailResponse`

**Business Rule**
- 분쟁 → `REJECTED`
- **Proposal·Offer 상태는 변경하지 않는다**
- Error: 공통 + `409 INVALID_STATUS`

---

## 2.4 Refund

서버에 대응 도메인이 없는 **신규 도메인**이다. 기존 `/v1/settlement/account`(러너 본인 정산 계좌)와는 무관하다.

### GET /v1/admin/refund

**Purpose** — 관리자 환불 목록

**Query Parameter**
```
status?: RefundStatus[]      // 'PENDING' | 'COMPLETED' | 'REJECTED'
requestedFrom?: string       // YYYY-MM-DD. 이 날짜 이후 요청분
keyword?: string             // 매칭 대상: proposalId, ordererName
page?: number
size?: number
```

**Request Body** — 없음

**Response** — `PageResponse<AdminRefundSummaryResponse>`
```
id: number
proposalId: number
proposalStatus: ProposalStatus
ordererId: string
ordererName: string
amount: number
status: RefundStatus
requestedAt: string
processedAt: string | null
```

**Business Rule**
- `proposalStatus`를 함께 내려 관리자 화면의 교차 조회를 없앤다

---

### GET /v1/admin/refund/{refund_id}

**Purpose** — 관리자 환불 상세

**Path Parameter** — `refund_id: number`

**Request Body** — 없음

**Response** — `AdminRefundDetailResponse` = Summary 전 필드 +
```
reason: string
refundBankName: string
refundAccountNumber: string      // 비마스킹 — D12 종속
refundAccountHolder: string
adminNote: string | null
```

**Business Rule**
- 관리자가 실제 송금해야 하므로 계좌번호는 **비마스킹**이 필요하다. **D12 결정 후 확정**
- Error: 공통 + `404 NOT_FOUND`

---

### POST /v1/admin/refund/{refund_id}/complete

**Purpose** — 환불 완료 처리

**Path Parameter** — `refund_id: number`

**Request Body** — `AdminRefundProcessRequest`
```
adminNote?: string | null
```

**Response** — `AdminRefundDetailResponse`

**Business Rule**
- 환불 → `COMPLETED`, `processedAt` 기록
- **연결된 Proposal을 취소시킨다 (cascade)**
- Error: 공통 + `409 INVALID_STATUS`

---

### POST /v1/admin/refund/{refund_id}/reject

**Purpose** — 환불 반려

**Path Parameter** — `refund_id: number`

**Request Body** — `AdminRefundProcessRequest`

**Response** — `AdminRefundDetailResponse`

**Business Rule**
- 환불 → `REJECTED`, `processedAt` 기록
- **Proposal 상태는 변경하지 않는다**
- Error: 공통 + `409 INVALID_STATUS`

---

## 2.5 Payout (수행비 입금)

서버에 대응 도메인이 없는 **신규 도메인**이다. 러너에게 지급할 수행비의 입금 처리 기록을 관리한다.

### GET /v1/admin/payout

**Purpose** — 관리자 수행비 입금 목록

**Query Parameter**
```
status?: PayoutStatus[]      // 'PENDING' | 'COMPLETED' | 'REJECTED'
proposalId?: number
keyword?: string
page?: number
size?: number
```

**Request Body** — 없음

**Response** — `PageResponse<AdminPayoutSummaryResponse>`
```
id: number
proposalId: number
offerId: number
runnerId: string
runnerName: string
amount: number
status: PayoutStatus
settledAt: string | null
```

**Business Rule**
- Payout은 **`offerId`를 키로 삼는다**. Mission 도메인 결정(D1)과 무관하게 성립하도록 설계했다

---

### GET /v1/admin/payout/{payout_id}

**Purpose** — 관리자 수행비 입금 상세

**Path Parameter** — `payout_id: number`

**Request Body** — 없음

**Response** — `AdminPayoutDetailResponse` = Summary 전 필드 +
```
payoutBankName: string
payoutAccountNumber: string      // 비마스킹 — D12 종속
payoutAccountHolder: string
adminNote: string | null
```

**Business Rule**
- 관리자가 실제 송금해야 하므로 계좌번호는 **비마스킹**이 필요하다. **D12 결정 후 확정**
- Error: 공통 + `404 NOT_FOUND`

---

### POST /v1/admin/payout/{payout_id}/complete

**Purpose** — 수행비 입금 완료 처리

**Path Parameter** — `payout_id: number`

**Request Body** — `AdminPayoutProcessRequest`
```
adminNote?: string | null
```

**Response** — `AdminPayoutDetailResponse`

**Business Rule**
- Payout → `COMPLETED`, `settledAt` 기록
- **Proposal·Offer 상태는 변경하지 않는다**
- Error: 공통 + `409 INVALID_STATUS`

---

### POST /v1/admin/payout/{payout_id}/reject

**Purpose** — 수행비 입금 반려

**Path Parameter** — `payout_id: number`

**Request Body** — `AdminPayoutProcessRequest`

**Response** — `AdminPayoutDetailResponse`

**Business Rule**
- Payout → `REJECTED`, `settledAt` 기록
- **Proposal·Offer 상태는 변경하지 않는다**
- Error: 공통 + `409 INVALID_STATUS`

---

## 2.6 Dashboard

### GET /v1/admin/summary

**Purpose** — 관리자 대시보드 미처리 건수 집계

**Query Parameter** — 없음

**Request Body** — 없음

**Response** — `AdminSummaryResponse`
```
unpaidCount: number         // 입금 확인이 필요한 요청 수
disputeCount: number        // 미처리 분쟁 수
refundCount: number         // 미처리 환불 수
settlementCount: number     // 미처리 수행비 입금 수
reportCount: number         // 미처리 신고 수
```

**Business Rule**
- 대시보드의 목록 5종은 각 목록 endpoint를 `status=<미처리>&size=N`으로 호출해 재사용한다. **대시보드 전용 목록 endpoint는 만들지 않는다**

---

# 3. Backend Decisions Required

## BLOCKING

결정 없이는 해당 API의 Contract 또는 구현 방향을 확정할 수 없다.

### D1. Mission 도메인이 서버에 존재하는가 — *전 Mission 관련 기능*

**현재 서버**
- Mission에 해당하는 리소스·스키마·endpoint가 스펙에 전혀 없다
- `openChatUrl`은 `ProposalDetailResponse`와 `OfferDetailResponse`에 각각 존재한다

**관리자에서 필요한 것**
- 미션 목록/상세 조회, 미션 상태, 미션 식별자, 미션 생성일
- 참여자별 임무 수행 완료 시각(행님/꼬붕) — 각각 미완료 가능(nullable)

**결정해야 할 것**
- 서버에 Mission 도메인이 존재하는가, 아니면 `Proposal + 수락된 Offer`가 미션의 실체인가
- 관리자 화면의 미션 식별자는 서버의 무엇에 대응하는가

> Contract 문서에서 **의도적으로 확정하지 않은 유일한 도메인**이다. 이 결정 전까지 Mission 관련 endpoint는 설계하지 않는다.

---

### D3. 관리자 인증/인가 방식 — *전 endpoint 공통*

**현재 서버**
- `/v1/admin/*` operation 중 `security`를 선언한 것이 하나도 없다
- 스펙 전체에서 정의된 스킴은 `HTTPBearer` 하나뿐이다

**관리자에서 필요한 것**
- 관리자 전용 인증과 일반 사용자 대비 권한 분리

**결정해야 할 것**
- admin endpoint의 인증 스킴은 무엇인가
- 관리자 권한은 어떻게 판별하는가 (역할 필드 / 별도 토큰 / 별도 발급 경로)
- 권한 없는 접근의 응답 코드 (`403 FORBIDDEN` 가정 중)

> 신규 17개 endpoint 전부에 걸리는 전역 결정이다.

---

### D4. Offer에 금액 개념이 있는가 — *GET /v1/admin/offer*

**현재 서버**
- `OfferResponse` / `OfferSummaryResponse` / `OfferDetailResponse` 어디에도 금액 필드가 없다
- 금액은 `Proposal.errandFee` 하나뿐이다

**관리자에서 필요한 것**
- 지원 목록의 `지원 금액` 컬럼

**결정해야 할 것**
- Offer에 금액 개념이 있는가
- 없다면 `AdminOfferSummaryResponse.amount`를 제거할 것인가, `Proposal.errandFee`를 대신 내려줄 것인가

---

### D5. 입금자명·플랫폼 입금 계좌의 소유 도메인 — *GET /v1/admin/proposal/{proposal_id}*

**현재 서버**
- 오더러가 기재한 입금자명, 플랫폼이 입금받는 계좌 정보가 어느 스키마에도 없다

**관리자에서 필요한 것**
- 입금 확인 시 입금자명과 플랫폼 계좌를 대조

**결정해야 할 것**
- `depositorName`은 Proposal이 보유하는가, 별도 결제/입금 도메인이 보유하는가
- 플랫폼 입금 계좌는 Proposal 응답에 담을 값인가, 전역 설정 조회 endpoint로 뺄 값인가

---

### D6. pending-payment를 유지할 것인가 — *GET /v1/admin/proposal/pending-payment*

**현재 서버**
- 200 응답 스키마가 `{}`로 비어 있어 반환 형태를 알 수 없다
- `skip`/`limit`을 쓴다 — 프로젝트 표준 `page`/`size`에서 이탈한 유일한 admin endpoint

**관리자에서 필요한 것**
- 입금 확인이 필요한 요청 목록. 신규 `GET /v1/admin/proposal?status=<입금대기>`로 완전히 대체 가능하다

**결정해야 할 것**
- 폐기하고 신규 목록으로 흡수할 것인가, 유지하고 응답 스키마 정의 + `page`/`size` 정렬할 것인가
- 유지 시 `GET /v1/admin/proposal/{proposal_id}`와의 라우트 등록 순서

**추천** — 신규 목록으로 흡수
**추천 이유** — 기능이 완전히 중복되고, 유지하면 프로젝트에 유일한 비표준 pagination과 라우트 충돌 위험이 남는다

---

### D8. offer resolve의 처리 방향 — *POST /v1/admin/offer/{offer_id}/resolve*

**현재 서버**
- Request Body가 없어 처리 결과와 관리자 메모를 전달할 수 없다

**관리자에서 필요한 것**
- 분쟁 처리 시 결과(`COMPLETED` / `CANCELLED`) 선택은 **필수 입력**, 관리자 메모는 선택 입력
- 반려(`REJECTED`)라는 세 번째 결과도 존재한다

**결정해야 할 것**
- 기존 `POST /v1/admin/offer/{offer_id}/resolve`에 body를 추가할 것인가
- 아니면 §2.3의 `POST /v1/admin/dispute/{dispute_id}/{resolve|reject}`로 대체하고 기존 endpoint를 폐기할 것인가
- 처리 단위가 Offer인가 Dispute인가

---

### D9. 신고 승인이 Proposal을 취소시키는가 — *POST /v1/admin/proposal-reports/{report_id}/accept*

**현재 서버**
- `accept`가 Proposal 상태에 어떤 영향을 주는지 스펙에 기술되어 있지 않다

**관리자에서 필요한 것**
- 관리자 화면은 "신고를 처리 완료하면 요청도 취소로 변경됩니다"라고 명시적으로 안내한다
- 반려 시에는 Proposal 상태가 그대로여야 한다

**결정해야 할 것**
- `accept`가 대상 Proposal을 취소시키는가
- 취소시키지 않는다면, 관리자 화면 안내를 바꿔야 하는가 서버 동작을 바꿔야 하는가

---

### D10. Dispute 처리 상태 모델 — *Dispute 4개 endpoint 전부*

**현재 서버**
- `DisputeEvidenceResponse`는 `id`, `proposalId`, `offerId`, `actorId`, `reason`, `surveyQuestionId`, `createdAt` 뿐이다
- 처리 상태, 관리자 메모, 처리 시각, 신청 대상자 정보가 없다
- 단건 조회만 있고 목록 조회 API가 없다

**관리자에서 필요한 것**
- 처리 상태 3값 (`PENDING` / `RESOLVED` / `REJECTED`)
- 관리자 메모, 처리 시각
- 신청자와 **신청 대상자** 각각의 이름과 역할 (`ORDERER` / `RUNNER`)
- 상태·키워드 필터가 붙은 페이지네이션 목록

**결정해야 할 것**
- `DisputeEvidence`를 확장할 것인가, 별도 Dispute 도메인을 둘 것인가
- 처리 상태를 어느 엔티티가 보유하는가
- 목록 조회 API 제공이 가능한가

---

### D12. 관리자 비마스킹 계좌 접근 정책 — *Refund·Payout 상세*

**현재 서버**
- `SettlementAccountResponse`는 `maskedAccountNumber`만 제공한다

**관리자에서 필요한 것**
- 관리자가 실제로 송금해야 하므로 환불 계좌·수행비 입금 계좌의 **전체 계좌번호**가 필요하다

**결정해야 할 것**
- 관리자에게 비마스킹 계좌번호를 내려줄 수 있는가
- 가능하다면 감사 로그·접근 제한 요건이 있는가
- 불가능하다면 관리자는 어떤 방식으로 송금 정보를 확보하는가

---

## NON-BLOCKING

다른 API 구현을 먼저 진행할 수 있다.

### D2. Proposal/Offer 상태 ↔ 관리자 UI 상태 매핑

**현재 서버**
- `ProposalStatus` 10값: `HOLDING`, `POSTED`, `OFFERED`, `MATCHED`, `ORDER_COMPLETED`, `ALL_COMPLETED`, `DISPUTED`, `RESOLVED`, `REPORTED`, `CANCELLED`
- `OfferStatus` 8값: `WAITING`, `ACCEPTED`, `RUNNER_COMPLETED`, `ALL_COMPLETED`, `DISPUTED`, `RESOLVED`, `REJECTED`, `CANCELLED`

**관리자에서 필요한 것**
- 각 서버 상태값이 관리자 화면의 어떤 상태에 해당하는지에 대한 확정된 답
- 특히 `HOLDING`, `POSTED`, `OFFERED`, `ORDER_COMPLETED`, `RESOLVED`, `REPORTED`, `RUNNER_COMPLETED`, `REJECTED`

**결정해야 할 것**
- 위 8개 값 각각의 관리자 화면 대응
- `RESOLVED`와 `REPORTED`는 현재 관리자 화면에 대응 표시가 아예 없다 — 별도 표시가 필요한가

> **NON-BLOCKING 근거** — 서버는 기존 enum을 그대로 내려주면 되고, 화면 라벨 변환은 Frontend Domain 계층이 담당한다. 서버 구현이 이 결정을 기다릴 필요는 없다. 단 D8의 `resolve` 목표 상태값은 이 매핑이 있어야 정확해진다.

---

### D7. 환불 cardinality

**현재 서버**
- Refund 도메인 자체가 없다

**관리자에서 필요한 것**
- 요청 1건에 환불이 몇 건까지 존재할 수 있는지

**결정해야 할 것**
- 요청 1건당 환불 1건인가, 다건이 가능한가

> **NON-BLOCKING 근거** — Contract는 이미 `refundId`를 키로 설계했고 `proposalId` unique를 가정하지 않는다. 어느 쪽이든 API 형태는 바뀌지 않는다.

---

### D11. adminNote 저장 방식

**현재 서버**
- 관리자 메모를 저장하는 필드가 어느 도메인에도 없다

**관리자에서 필요한 것**
- Proposal 취소, Dispute 처리, Refund 처리, Payout 처리 각각에 관리자 메모(선택 입력)

**결정해야 할 것**
- 각 도메인의 단일 필드로 둘 것인가, 처리 이력 테이블로 둘 것인가

> **NON-BLOCKING 근거** — 요청 body는 `adminNote?: string | null`, 응답은 `adminNote: string | null`로 이미 확정되어 있다. 저장 구조는 서버 내부 구현 사항이다. 이력으로 관리할 경우 응답은 최신 1건을 내려주면 된다.

---

# 4. Implementation Checklist

```
[ ] 사전 결정 (BLOCKING 9건)
    [ ] D1  Mission 도메인 존재 여부
    [ ] D3  관리자 인증/인가 방식
    [ ] D4  Offer 금액 존재 여부
    [ ] D5  입금자명 / 플랫폼 입금 계좌 소유 위치
    [ ] D6  pending-payment 유지 여부
    [ ] D8  offer resolve 처리 방향
    [ ] D9  신고 승인 시 Proposal cascade 취소 여부
    [ ] D10 Dispute 처리 상태 모델
    [ ] D12 관리자 비마스킹 계좌 접근 정책

[ ] 기존 API 수정
    [ ] POST /v1/admin/proposal/{proposal_id}/confirm-payment   — Request Body 추가
    [ ] GET  /v1/admin/proposal/pending-payment                 — 응답 스키마 정의 + page/size (D6)
    [ ] GET  /v1/admin/proposal-reports                         — keyword·proposalId query, proposalStatus 응답 필드
    [ ] POST /v1/admin/offer/{offer_id}/resolve                 — 처리 방향 확정 후 구현 (D8)

[ ] Proposal
    [ ] GET  /v1/admin/proposal
    [ ] GET  /v1/admin/proposal/{proposal_id}
    [ ] POST /v1/admin/proposal/{proposal_id}/cancel

[ ] Offer
    [ ] GET  /v1/admin/offer

[ ] Dispute
    [ ] GET  /v1/admin/dispute
    [ ] GET  /v1/admin/dispute/{dispute_id}
    [ ] POST /v1/admin/dispute/{dispute_id}/resolve
    [ ] POST /v1/admin/dispute/{dispute_id}/reject

[ ] Refund
    [ ] GET  /v1/admin/refund
    [ ] GET  /v1/admin/refund/{refund_id}
    [ ] POST /v1/admin/refund/{refund_id}/complete
    [ ] POST /v1/admin/refund/{refund_id}/reject

[ ] Payout
    [ ] GET  /v1/admin/payout
    [ ] GET  /v1/admin/payout/{payout_id}
    [ ] POST /v1/admin/payout/{payout_id}/complete
    [ ] POST /v1/admin/payout/{payout_id}/reject

[ ] Dashboard
    [ ] GET  /v1/admin/summary

[ ] OpenAPI 갱신
    [ ] 신규 17개 endpoint 반영
    [ ] 수정 4개 endpoint 반영
    [ ] 신규 스키마 등록
        AdminProposalSummaryResponse / AdminProposalDetailResponse
        AdminConfirmPaymentRequest / AdminProposalCancelRequest
        AdminOfferSummaryResponse
        AdminDisputeSummaryResponse / AdminDisputeDetailResponse
        AdminDisputeResolveRequest / AdminDisputeRejectRequest
        AdminRefundSummaryResponse / AdminRefundDetailResponse / AdminRefundProcessRequest
        AdminPayoutSummaryResponse / AdminPayoutDetailResponse / AdminPayoutProcessRequest
        AdminSummaryResponse
        DisputeProcessStatus / DisputeActorRole / DisputeOutcome
        RefundStatus / PayoutStatus
    [ ] admin operation에 security 선언 추가 (D3)
    [ ] 신규 ErrorCode 필요 시 ErrorCode enum에 추가
```

> Mission 관련 endpoint는 이 체크리스트에 없다. **D1 결정 전까지 설계하지 않는다.**


</details>
