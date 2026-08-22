# Admin API Contract / Domain 설계

최초 작성 2026-08-22 · **2026-08-22 구현 반영 개정** · 범위: 관리자 API 설계와 Frontend 타입

> ## 상태: 서버 구현 완료
>
> 이 문서가 제안한 API를 백엔드가 전부 구현해 스테이징(`43.200.56.9`)에 반영했다.
> 관리자 operation은 6개 → **28개**가 되었고, `docs/api-spec/openapi.json`은 실제 스펙으로 동기화되어 있다.
>
> - **§1~§3** — 최초 조사 결과. 관리자 UI 요구사항의 기록으로 그대로 유효하다.
> - **§4~§5** — 설계 당시의 Gap 분석. **역사적 기록**이며 현재 서버 상태와 다르다.
> - **§6~§9** — **실제 구현된 스펙 기준으로 전면 개정**했다. 연동 작업은 이쪽만 본다.
>
> 설계안과 구현이 달라진 4곳은 §6.0에 모아 두었다.

Source of Truth
- 관리자 요구사항: `src/presentation/` 현재 구현 코드 + `src/presentation/demo/`
- API: `docs/api-spec/openapi.json` (2026-08-22 동기화), `src/data/api/`

---

## 1. Current Admin Requirements

라우트: `src/presentation/routes/paths.ts`, 내비: `src/presentation/layout/navItems.ts`

### 1.1 대시보드 `/` — `DashboardPage.tsx`

| 항목 | 내용 |
|---|---|
| 목적 | 관리자가 **처리해야 할 항목**만 모아 보여준다 |
| 표시 | 요약 카드 5개(`unpaid`/`dispute`/`refund`/`settlement`/`report`) + 카드별 목록 5개 |
| 카드 값 | 각각 `요청 status='미입금'`, `분쟁 status='미처리'`, `환불 status='미처리'`, `미션 status='완료' AND settlementStatus='미처리'`, `신고 reportStatus='미처리'` 건수 |
| 필터 | 카드 클릭 → `?card=` 로 섹션 1개만 표시(토글). 클라이언트 전용 |
| 검색/정렬/페이지네이션 | 없음 |
| Action | 행 클릭 → 요청 상세의 해당 탭으로 이동. **Mutation 없음** |
| 목록 컴포넌트 | `RequestTable`/`DisputeTable`/`RefundTable`/`MissionTable`/`ReportTable` 재사용 |

### 1.2 요청 관리 `/requests` — `RequestListPage.tsx` + `RequestTable.tsx`

| 항목 | 내용 |
|---|---|
| 표시 컬럼 | 요청 ID, 행님, 금액, 요청 상태, **지원 수**, 생성일 |
| 검색 | `q` — proposalId(부분·대소문자 무시) 또는 행님 이름(부분) |
| 필터 | `status` — 전체/미입금/대기중/진행중/완료/취소/분쟁중 |
| 정렬 | 없음(목데이터 배열 순서 = 생성일 역순) |
| Pagination | 없음. 총 건수만 표시 |
| Action | 행 클릭 → `/requests/:proposalId` |

### 1.3 요청 상세 `/requests/:proposalId` — `RequestDetailPage.tsx`

기본 정보 카드: 행님, 요청 생성일, 요청 상태, 요청 금액, **선택된 지원**(offerId + 꼬붕 이름).

헤더 Action
- `입금 확인` — `status==='미입금'`일 때만. → `StatusChangeModal`
- `요청 취소` — `status ∈ {미입금, 대기중}`일 때만. → `CancelRequestConfirmModal`

탭 5개 (`requestTabs.ts`, `?tab=`): `offers` / `mission` / `dispute` / `refund` / `report`

#### 입금 확인 모달 (`StatusChangeModal`)
- 표시: 요청 #ID, `현재상태 → 대기중` 전이, **입금 계좌**(`DEMO_DEPOSIT_ACCOUNT` = 플랫폼 계좌), **입금자명**(`request.depositorName`)
- 입력: **오픈채팅방 URL (필수)** — `http://`/`https://` 접두 검증
- 결과: 요청 상태 → `대기중`

#### 요청 취소 모달 (`CancelRequestConfirmModal`)
- 표시: `현재상태 → 취소` 전이, 연결된 지원 수, `refundRequired`(= 환불 존재 OR 상태≠미입금) 경고, 미션 동반 취소 안내
- 입력: 관리자 메모(선택)
- 결과: 요청 `취소` + 선택된 지원 `취소` + 미션 `취소` (**cascade**)

#### 탭: 지원 목록 (`OfferListTab`)
- 테이블: 지원 ID, 꼬붕, 상태, 신청일, 선택 여부. 선택된 행 하이라이트
- 행 클릭 → 지원 상세 Modal(위 항목 + **지원 메시지**). **읽기 전용, Mutation 없음**

#### 탭: 미션 정보 (`MissionInfoTab`)
- InfoCard: 미션 ID, 상태, 행님, 꼬붕, 연결된 요청, 선택된 지원, 생성일, 행님 완료 시각, 꼬붕 완료 시각
- 완료 시각은 각 참여자가 `임무 수행 완료`를 누른 시각. 양쪽 모두 완료해야 미션이 `완료`, 관리자는 조회 전용
- `mission.status==='완료'`일 때만 추가: 수행비, 수행비 입금 상태, 입금일, 관리자 메모
- 오픈채팅방 URL + 클립보드 복사
- Action: `수행비 입금` — `status==='완료' AND settlementStatus==='미처리'`일 때만 → `MissionPayoutModal`

#### 수행비 입금 모달 (`MissionPayoutModal`)
- 표시: 미션 #ID, 수행비 금액, `요청상태 → 요청상태`(불변), **입금 계좌 + 예금주명**(꼬붕 정산 계좌)
- 입력: 관리자 메모(선택)
- Action 2개: `입금 완료` → settlement `처리 완료` + 입금일 / `반려` → `반려` + 입금일. **요청 상태 불변**

#### 탭: 분쟁 정보 (`DisputeInfoTab`)
- InfoCard: 분쟁 ID, 처리 여부, 분쟁 사유, 신청자(이름+역할), 신청 대상(이름+역할), 신청일, 관리자 메모
- 관련 객체 카드: 요청/지원/미션 각각의 ID + 현재 상태
- Action: `분쟁 처리` — `disputeStatus==='미처리'`일 때만 → `DisputeResolveModal`

#### 분쟁 처리 모달 (`DisputeResolveModal`)
- 입력: outcome 라디오 **`미션 완료` | `미션 취소`** (필수), 관리자 메모(선택)
- 선택 시 미션/지원/요청의 `현재 → 다음` 전이 미리보기
- `분쟁 처리 완료` → 분쟁 `처리 완료` + outcome에 따라 요청·지원·미션 일괄 `완료` 또는 `취소`
- `반려` → 분쟁 `반려`, **다른 상태 불변**

#### 탭: 환불 정보 (`RefundInfoTab`)
- InfoCard: 환불 상태, 환불 금액, 환불 사유, 요청일, 처리일, 관리자 메모
- Action: `환불 처리` — `refundStatus==='미처리'`일 때만 → `RefundProcessModal`

#### 환불 처리 모달 (`RefundProcessModal`)
- 표시: 요청 #ID, 환불 금액, 요청 상태 전이(이미 취소면 전이 없음), **환불 계좌 + 예금주명**(행님 계좌)
- 입력: 관리자 메모(선택)
- `환불 완료` → 환불 `처리 완료` + 처리일 + **요청 cascade 취소** / `반려` → `반려` + 처리일, 요청 상태 불변

#### 탭: 신고 정보 (`ReportInfoTab`)
- 테이블: 신고 ID, 신고자, 신고 사유, 처리 상태, 처리 버튼, 신고일
- 행 클릭 → 신고 상세 Modal(신고 ID, 처리 상태, 신고자 ID, 신고일, 신고 사유, 상세 내용)
- Action: 행별 `신고 처리` — 해당 신고가 `미처리`일 때만 → `ConfirmModal`
  - `처리 완료` → 신고 `처리 완료` + **요청 cascade 취소** / `반려` → `반려`, 요청 상태 불변

### 1.4 지원 관리 `/offers` — `OfferListPage.tsx`

| 항목 | 내용 |
|---|---|
| 표시 컬럼 | 지원 ID, 요청 ID, 꼬붕, **지원 금액**, 지원 상태, 선택 여부, 신청일 |
| 검색 | `q` — offerId / proposalId / 꼬붕 이름 |
| 필터 | `status`(전체/대기중/선택됨/진행중/완료/취소/분쟁중), `selected`(전체/선택됨/미선택), `dispute`(전체/분쟁 있음/분쟁 없음) |
| Action | 행 클릭 → 요청 상세. **Mutation 없음** |

### 1.5 미션 관리 `/missions` — `MissionListPage.tsx`

| 항목 | 내용 |
|---|---|
| 표시 컬럼 | 미션 ID, 요청 ID, 행님, 꼬붕, 미션 상태, **처리 여부**(완료 미션만 settlementStatus), 오픈채팅방 복사 버튼, 생성일 |
| 검색 | `q` — missionId / proposalId / 행님 / 꼬붕 |
| 필터 | `status`(전체/진행중/완료/취소/분쟁중) |
| Action | 행 클릭 → 요청 상세 `mission` 탭. 복사 버튼(클라이언트 전용) |

### 1.6 분쟁 관리 `/disputes` — `DisputeListPage.tsx`

| 항목 | 내용 |
|---|---|
| 표시 컬럼 | 분쟁 ID, 요청 ID, 지원 ID, 신청자, **역할**(행님/꼬붕), 처리 여부, 신청일 |
| 검색 | `q` — disputeId / proposalId / offerId / 신청자 이름 |
| 필터 | `status`(전체/미처리/처리 완료/반려) |
| Action | 행 클릭 → 요청 상세 `dispute` 탭 |

### 1.7 환불 관리 `/refunds` — `RefundListPage.tsx`

| 항목 | 내용 |
|---|---|
| 표시 컬럼 | 요청 ID, 행님, 환불 금액, **요청 상태**(교차 조회), 처리 여부, 요청일, 처리일 |
| 검색 | `q` — proposalId / 행님 이름 |
| 필터 | `status`(전체/미처리/처리 완료/반려), **`from`(요청일 시작, `YYYY-MM-DD`)** |
| 특이사항 | rowKey가 `proposalId` — **요청 1건당 환불 1건** 전제 |

### 1.8 신고 관리 `/reports` — `ReportListPage.tsx`

| 항목 | 내용 |
|---|---|
| 표시 컬럼 | 신고 ID, 신고 대상(요청 #ID), 신고자 ID, 신고 사유 + 상세, 처리 여부, 신고일 |
| 검색 | `q` — reportId / proposalId / reporterId / **사유 텍스트 / 상세 내용** |
| 필터 | `status`(전체/미처리/처리 완료/반려) |
| Action | 행 클릭 → 요청 상세 `report` 탭 |

### 1.9 도메인 관계 (코드에서 확인된 것)

```
Proposal(요청) 1 ── N Offer(지원)          offer.proposalId
Proposal       1 ── 0..1 Offer(selected)   request.selectedOfferId
Proposal       1 ── 0..1 Mission           mission.proposalId, request.missionId
Mission        1 ── 1 Offer                mission.offerId
Proposal       1 ── 0..1 Dispute           dispute.{proposalId, offerId, missionId}
Proposal       1 ── 0..1 Refund            refund.proposalId (rowKey)
Proposal       1 ── N ProposalReport       report.proposalId
```

---

## 2. Existing API

### 2.1 현재 FE가 호출하는 것 — `src/data/api/adminApi.ts`

openapi.json에서 `관리자` 태그가 붙은 6개 operation이 전부다.

| Method | Path | Purpose | Request | Response | Domain | 관리자 재사용 |
|---|---|---|---|---|---|---|
| GET | `/v1/admin/proposal-reports` | 신고 목록 | query `status?`, `page=0`, `size=20` | `ApiResponse<PageResponse<ProposalReportResponse>>` | ProposalReport | **가능** |
| POST | `/v1/admin/proposal-reports/{report_id}/accept` | 신고 승인 | body 없음 | `ApiResponse<ProposalReportResponse>` | ProposalReport | **가능** |
| POST | `/v1/admin/proposal-reports/{report_id}/reject` | 신고 반려 | body 없음 | `ApiResponse<ProposalReportResponse>` | ProposalReport | **가능** |
| POST | `/v1/admin/proposal/{proposal_id}/confirm-payment` | 입금 확인 | body 없음 | `ApiResponse<ProposalResponse>` | Proposal | **확장 필요** |
| GET | `/v1/admin/proposal/pending-payment` | 입금 대기 목록 | query `skip=0`, `limit=100` | **200 schema가 `{}`** (미정의) | Proposal | **확장 필요** |
| POST | `/v1/admin/offer/{offer_id}/resolve` | 지원 분쟁 해결 | body 없음 | `ApiResponse<OfferResponse>` | Offer | **확장 필요** |

### 2.2 비관리자 API 중 관리자 요구사항과 관련 있는 것

| Method | Path | Purpose | 관리자 재사용 |
|---|---|---|---|
| GET | `/v1/proposal` | 공개 요청 목록 (`status[]`, `page`, `size`) → `PageResponse<ProposalResponse>` | 불가 — 공개 목록이라 관리자 필드 없음 |
| GET | `/v1/proposal/own` | 내 요청 목록 → `ProposalOwnResponse`(**`offerCount`, `createdAt` 포함**) | 불가(본인 한정) — 단 **필드 참고 대상** |
| GET | `/v1/proposal/{id}` | 요청 상세 → `ProposalDetailResponse`(**`openChatUrl`, `offers[]` 포함**) | 조건부 가능 |
| POST | `/v1/proposal/{id}/cancel` | 요청 취소 (오더러용) | 불가 — 권한·cascade 다름 |
| GET | `/v1/offer?proposalId=` | 요청별 지원 목록 → `list<OfferSummaryResponse>` | 조건부 가능 |
| GET | `/v1/offer/{id}` | 지원 상세 → `OfferDetailResponse`(**`openChatUrl` 포함**) | 조건부 가능 |
| GET | `/v1/dispute-evidence?proposalId=&offerId=` | 분쟁 증빙 상세 → `DisputeEvidenceResponse` | **부분 가능**(처리 상태 없음) |
| GET | `/v1/dispute-survey/questions?targetType=ORDER\|RUNNER` | 분쟁 사유 질문 | 참고용 |
| GET | `/v1/proposal-report-reasons` | 신고 사유 질문 | 참고용 |
| GET/PUT | `/v1/settlement/account` | **러너 본인**의 정산 계좌 | 불가(본인 한정, 마스킹됨) |
| GET | `/v1/settlement/banks` | 은행명 목록 | 참고용 |

### 2.3 기존 convention (`src/data/api/`, openapi.json)

| 항목 | 규칙 |
|---|---|
| Envelope | 성공 `ApiResponse<T> = { success, data?, message? }`. `httpClient.requestEnvelope`가 `data`만 언랩 |
| Pagination | `PageResponse<T> = { content, totalElements, totalPages, pageNumber, pageSize, first, last }`, query `page`(0-base) + `size`(1~100, 기본 20). **예외: `pending-payment`만 `skip`/`limit`, `/v1/notifications`만 `page`(1-base)/`page_size`** |
| Query naming | camelCase (`proposalId`, `targetType`, `status`). snake는 path param(`{proposal_id}`)에서만 |
| Filter | 배열 필터는 파라미터 반복(`status=A&status=B`) |
| Sorting | **전 API에 정렬 파라미터 없음** |
| 상태 변경 | `POST /{resource}/{id}/{verb}` (`accept`, `reject`, `cancel`, `resolve`, `confirm-payment`, `complete-delivery`, `confirm-received`). **body 없음**이 기본 |
| Error | `ErrorResponse = { success?, error: { code: ErrorCode, message, details? }, timestamp? }`. `ErrorCode` 38값 고정 union |
| DTO naming | `XxxResponse` / `XxxRequest` / `XxxCreate`. 파일 = `src/data/api/contracts/{domain}.ts` |
| Status enum | `as const` 배열 + `(typeof X)[number]` union, `src/domain/status/{name}.ts`. `enum` 금지 |
| Domain/DTO 분리 | **현재 분리되어 있지 않다.** Mapper 계층 없음. contract 타입이 status만 `domain/status`에서 import |
| HTTP Method | `httpClient.HttpMethod = 'GET' | 'POST'` 만 정의됨 |
| 인증 | **미확정.** 관리자 operation 중 `security`를 선언한 것이 없다. `setAuthTokenProvider`는 준비만 되어 있고 어디에도 연결돼 있지 않음(`AUTH_CONTRACT_UNCONFIRMED`) |

---

## 3. Required API Capabilities

UI Requirement → Required Data/Action → Required API Capability

| # | UI 위치 | 필요한 Capability |
|---|---|---|
| C1 | 대시보드 카드 | 5개 미처리 건수 집계 |
| C2 | 대시보드 목록 5개 | 각 도메인의 "미처리" 목록 상위 N건 |
| C3 | 요청 목록 | 요청 목록 + keyword/status 필터 + `offerCount` |
| C4 | 요청 상세 기본 정보 | 요청 단건 + 행님 이름 + 금액 + 선택된 지원(id, 꼬붕 이름) |
| C5 | 입금 확인 | 플랫폼 입금 계좌 + 입금자명 조회 / **오픈채팅방 URL과 함께 입금 확인 커밋** |
| C6 | 요청 취소 | 요청 취소 커밋(지원·미션 cascade) + 관리자 메모 |
| C7 | 지원 목록 탭 | 요청별 지원 목록 + 지원 메시지 |
| C8 | 미션 정보 탭 | 미션 단건 + 오픈채팅방 URL + 수행비/정산 정보 |
| C9 | 수행비 입금 | 꼬붕 정산 계좌(비마스킹) 조회 / 입금 완료·반려 커밋 + 메모 |
| C10 | 분쟁 정보 탭 | 분쟁 단건 + 신청자·대상의 이름과 역할 + 처리 상태 + 관리자 메모 |
| C11 | 분쟁 처리 | outcome(완료/취소) + 메모로 분쟁 해결 커밋 / 반려 커밋 |
| C12 | 환불 정보 탭 | 환불 단건 + 행님 환불 계좌·예금주 |
| C13 | 환불 처리 | 환불 완료(요청 cascade 취소)·반려 커밋 + 메모 |
| C14 | 신고 정보 탭 | 요청별 신고 목록 |
| C15 | 신고 처리 | 신고 승인(요청 cascade 취소)·반려 커밋 |
| C16 | 지원 관리 | 전체 지원 목록 + keyword/status/selected/hasDispute 필터 + 지원 금액 |
| C17 | 미션 관리 | 전체 미션 목록 + keyword/status 필터 |
| C18 | 분쟁 관리 | 전체 분쟁 목록 + keyword/status 필터 |
| C19 | 환불 관리 | 전체 환불 목록 + keyword/status/requestedFrom 필터 |
| C20 | 신고 관리 | 전체 신고 목록 + keyword/status 필터 |
| C21 | 전 페이지 | 관리자 인증/인가 |

---

## 4. Gap Analysis

### 기존 API 사용 가능

| Capability | 근거 |
|---|---|
| C14 / C20 (신고 목록) | `GET /v1/admin/proposal-reports` — status·page·size 충족. **단 keyword 검색 없음 → 확장 필요(G7)** |
| C15 (신고 승인/반려) | `POST .../accept`, `.../reject` 그대로 사용 |

### 기존 API 확장 필요

| # | Capability | Gap |
|---|---|---|
| G1 | C5 | `confirm-payment`에 **body 없음**. UI는 `openChatUrl` 필수 입력 → Request Body 추가 필요 |
| G2 | C5 | 플랫폼 입금 계좌·**입금자명(`depositorName`)** 이 어느 스키마에도 없음 |
| G3 | C11 | `POST /v1/admin/offer/{id}/resolve`에 body 없음. UI는 **outcome(미션 완료/미션 취소) + adminNote** 필요 |
| G4 | C10/C18 | `DisputeEvidenceResponse`에 **처리 상태·관리자 메모·신청자 이름/역할·대상**이 없음. 목록 API도 없음(단건 조회만) |
| G5 | C16 | `OfferResponse`/`OfferSummaryResponse`에 **지원 금액 필드 없음**. UI 지원 관리 목록은 이 컬럼을 표시 |
| G6 | C3 | `PageResponse<ProposalResponse>`에 `ordererName`·`createdAt`·`offerCount` 없음(`ProposalOwnResponse`에는 있음) |
| G7 | C3/C16/C18/C19/C20 | 전 목록 API에 **keyword 검색 파라미터 없음** |
| G8 | C1 | 집계 API 없음. 현재는 클라이언트에서 배열 length 계산 |
| G9 | — | `pending-payment`의 200 schema가 `{}` — 응답 형태 미정의. `skip`/`limit`도 프로젝트 표준(`page`/`size`)에서 이탈 |

### 신규 API 필요

| # | Capability | 내용 |
|---|---|---|
| N1 | C3 | `GET /v1/admin/proposal` — 관리자 요청 목록 |
| N2 | C4 | `GET /v1/admin/proposal/{proposal_id}` — 관리자 요청 상세 |
| N3 | C6 | `POST /v1/admin/proposal/{proposal_id}/cancel` — 관리자 요청 취소(cascade + 메모) |
| N4 | C7/C16 | `GET /v1/admin/offer` — 관리자 지원 목록 |
| N5 | C10/C18 | `GET /v1/admin/dispute`, `GET /v1/admin/dispute/{dispute_id}` |
| N6 | C11 | `POST /v1/admin/dispute/{dispute_id}/resolve`, `.../reject` |
| N7 | C12/C19 | `GET /v1/admin/refund`, `GET /v1/admin/refund/{refund_id}` |
| N8 | C13 | `POST /v1/admin/refund/{refund_id}/complete`, `.../reject` |
| N9 | C9 | `GET /v1/admin/payout`, `POST /v1/admin/payout/{payout_id}/complete`, `.../reject` |
| N10 | C1 | `GET /v1/admin/summary` — 대시보드 집계 |

### 확인 필요 → **전부 해소됨** (2026-08-22)

설계 당시 미확정이던 7건은 백엔드 구현으로 모두 답이 나왔다. 상세는 §9 참조.

| # | 항목 | 결과 |
|---|---|---|
| Q1 | Mission 도메인 | **존재한다.** `/v1/admin/missions/*` 4개 구현 |
| Q2 | UI 상태 ↔ 서버 enum 매핑 | **미해결.** `ProposalStatus`/`OfferStatus` enum은 변경 없음 (§9 참조) |
| Q3 | 관리자 인증 | `POST /v1/admin/auth/login` + Bearer. admin 27개에 `security` 선언됨 |
| Q4 | Offer 금액 | `amount: integer` (required). Proposal `errandFee` 값 |
| Q5 | 입금자명·플랫폼 계좌 | 계좌 3필드 제공. **`depositorName`은 항상 `null`** — 제품 결정 필요 |
| Q6 | pending-payment | **유지 + deprecated.** `page`/`size`, `PageResponse` 반환 |
| Q7 | 환불 cardinality | Refund는 Mission 파생. `refundId` = 미션 ID |

---

## 5. Consistency Review

신규/확장 API가 기존 convention과 일치하는지.

| 항목 | 일치 | 비고 |
|---|---|---|
| Envelope | ✅ | 전부 `ApiResponse<T>` |
| Pagination | ✅ | `page`(0-base)+`size`(1~100, 기본 20) + `PageResponse<T>`. `pending-payment`의 `skip`/`limit`는 따르지 않음 |
| Query naming | ✅ | camelCase |
| Path param | ✅ | snake_case (`{proposal_id}`, `{dispute_id}`) |
| 상태 변경 verb | ✅ | `POST /{resource}/{id}/{verb}` |
| 리소스 경로 | ✅ | 기존 admin의 **단수**(`/v1/admin/proposal/...`, `/v1/admin/offer/...`)에 맞춰 신규도 전부 단수로 통일한다. 기존 `/v1/admin/proposal-reports`만 복수이며 그대로 둔다 |
| Request Body | ⚠️ | 기존 상태 변경 verb는 **body 없음**이 기본인데, 관리자 메모·outcome·openChatUrl 때문에 신규 4곳에 body가 생긴다 (아래) |
| Error | ✅ | 기존 `ErrorCode` union 재사용. 신규 코드가 필요하면 백엔드에서 union에 추가 |
| Sorting | ✅ | 파라미터 없음(기존과 동일). UI도 정렬 UI 없음 |
| DTO naming | ✅ | `XxxResponse`/`XxxRequest`, `src/data/api/contracts/{domain}.ts` |
| Status enum | ✅ | `as const` + union, `src/domain/status/` |
| Domain/DTO 분리 | ✅ | 기존대로 **분리하지 않는다**. Mapper/Adapter 계층을 이번에 새로 만들지 않는다 |
| HttpMethod | ⚠️ | 신규 API 전부 GET/POST만 사용하므로 `httpClient`의 `HttpMethod` 변경 불필요 |

### body가 생기는 4곳 (기존 convention 이탈, 근거 명시)

| Endpoint | body | 근거 |
|---|---|---|
| `POST /v1/admin/proposal/{id}/confirm-payment` | `{ openChatUrl }` | `StatusChangeModal`이 URL을 **필수 입력**으로 검증하고 있음 |
| `POST /v1/admin/proposal/{id}/cancel` | `{ adminNote? }` | `CancelRequestConfirmModal` textarea |
| `POST /v1/admin/dispute/{id}/resolve` | `{ outcome, adminNote? }` | `DisputeResolveModal` 라디오 필수 + textarea |
| `POST /v1/admin/{refund,payout}/{id}/{complete,reject}` | `{ adminNote? }` | 각 모달 textarea |

기존 `accept`/`reject`(신고)에는 메모 입력 UI가 없으므로 body를 추가하지 않는다.

---

## 6. API Contract (구현 완료 · as-built)

아래는 제안이 아니라 **`43.200.56.9`에 실제 배포된 스펙**이다. 원본은 `docs/api-spec/openapi.json`.

### 6.0 설계안과 구현이 달라진 4곳

연동 전에 반드시 확인해야 하는 차이다.

| # | 설계안 (이 문서 최초 버전) | 실제 구현 |
|---|---|---|
| 1 | `RefundStatus`와 `PayoutStatus`를 별도 union으로 | **`PayoutStatus` 하나를 공유한다.** `AdminRefundSummaryResponse.status`도 `PayoutStatus`다 |
| 2 | `DisputeOutcome = 'COMPLETED' \| 'CANCELLED'` | **`MissionResolution = 'COMPLETED' \| 'FAILED'`** — `CANCELLED`가 아니라 `FAILED` |
| 3 | Refund/Payout이 독립 도메인 | **Mission 파생**이다. 별도 테이블 없이 `missions.settlement_paid_at`/`refunded_at`에서 상태를 만든다. `refundId`/`payoutId` = **미션 ID** |
| 4 | 각 verb마다 전용 Request 타입 | **`AdminNoteRequest { adminNote?, adminId? }` 하나를 공유**한다 (cancel, dispute reject, refund/payout complete·reject) |

추가로 스키마 이름이 갈라졌다. `ApiResponse_AuthTokenResponse_`가 `app__schemas__common__ApiResponse_AuthTokenResponse_`와 `app__schemas__user__ApiResponse_AuthTokenResponse_` 두 개로 존재한다. **관리자 로그인은 `common` 쪽**이다. 코드젠을 쓸 경우 이름 충돌에 주의한다.

### 6.1 공통

- 성공 응답은 모두 `ApiResponse<T>`. FE는 `requestEnvelope`가 언랩한 `T`를 본다
- 목록은 `PageResponse<T>`, query `page`(0-base, 기본 0) + `size`(1~100, 기본 20)
- 배열 필터는 파라미터 반복 (`status=A&status=B`)
- 관리자 endpoint 27개 전부 `security: [{HTTPBearer: []}]`. **로그인만 예외**
- 공통 Error: `401`, `403`, `500`. 상세/변경 endpoint는 `404`, 상태 변경은 `409`·`400` 추가

### 6.2 인증

**`POST /v1/admin/auth/login`** — 관리자 로그인 · `security` 없음

| | |
|---|---|
| Body | `AdminLoginRequest { username: string, password: string }` (둘 다 required) |
| 200 | `app__schemas__common__ApiResponse_AuthTokenResponse_` |
| Error | `400`, `401 ADMIN_CREDENTIALS_INVALID`, `500` |

`AuthTokenResponse`
```
accessToken: string      // required
refreshToken: string     // required
tokenType?: string
expiresIn: number        // required
userId: string           // required
```

### 6.3 대시보드

**`GET /v1/admin/summary`** — Query 없음

`AdminSummaryResponse` — 5필드 전부 required
```
unpaidCount, disputeCount, refundCount, settlementCount, reportCount: number
```

### 6.4 요청 (Proposal)

**`GET /v1/admin/proposal`**

Query: `status?: ProposalStatus[]`, `keyword?`(요청 ID·행님 이름), `page`, `size`

`AdminProposalSummaryResponse` — required: `id`, `ordererId`, `errandFee`, `status`, `offerCount`, `createdAt`
```
id: number
ordererId: string
ordererName: string | null
errandFee: number
status: ProposalStatus
offerCount: number
createdAt: string
```

**`GET /v1/admin/proposal/{proposal_id}`** → `AdminProposalDetailResponse`

required: `id`, `title`, `content`, `deadline`, `errandFee`, `ordererId`, `status`, `createdAt`
```
id: number
title: string
content: string
deadline: string
errandFee: number
ordererId: string
ordererName: string | null
ordererLevel: number
status: ProposalStatus
createdAt: string
openChatUrl: string | null
acceptedOfferId: number | null
acceptedRunnerName: string | null
missionId: number | null
adminNote: string | null
depositorName: string | null          // 항상 null — 서버에 생성 흐름 없음
depositBankName: string | null
depositAccountNumber: string | null
depositAccountHolder: string | null
matchedAt, runnerConfirmedAt, ordererConfirmedAt, disputedAt, resolvedAt: string | null
```

**`POST /v1/admin/proposal/{proposal_id}/confirm-payment`**

| | |
|---|---|
| Body | `AdminConfirmPaymentRequest { openChatUrl: string }` — **required** |
| 200 | `ProposalResponse` |
| Error | `400`, `401`, `403`, `404`, `500` |

**`POST /v1/admin/proposal/{proposal_id}/cancel`**

| | |
|---|---|
| Body | `AdminNoteRequest \| null` |
| 200 | `AdminProposalDetailResponse` |
| Error | 공통 + `404`, `409`, `400` |

**`GET /v1/admin/proposal/pending-payment`** — **DEPRECATED**

`page`/`size` → `PageResponse<AdminProposalSummaryResponse>`. `GET /v1/admin/proposal?status=...`로 대체됐다. **신규 코드에서 쓰지 않는다.**

### 6.5 지원 (Offer)

**`GET /v1/admin/offer`**

Query: `proposalId?`, `status?: OfferStatus[]`, `accepted?: boolean`, `hasDispute?: boolean`, `keyword?`(지원 ID·요청 ID·꼬붕 이름), `page`, `size`

`AdminOfferSummaryResponse` — required: `id`, `proposalId`, `runnerId`, `status`, `accepted`, `hasDispute`, `amount`, `createdAt`
```
id: number
proposalId: number
runnerId: string
runnerName: string | null
runnerLevel: number
status: OfferStatus
accepted: boolean
hasDispute: boolean
amount: number                 // Proposal errandFee 값
openChatUrl: string | null
createdAt: string
```

> 지원 메시지(`message`) 필드는 **구현되지 않았다.** 요청 상세의 지원 상세 Modal에서 이 값을 쓸 수 없다 — §9 참조.

### 6.6 미션 (Mission)

**`GET /v1/admin/missions`** — Query: `status?: MissionStatus[]`, `page`, `size`
**`GET /v1/admin/missions/{mission_id}`** → `MissionResponse`

`MissionResponse` — required: `id`, `proposalId`, `offerId`, `ordererId`, `runnerId`, `status`, `errandFee`, `settlementPaid`, `refunded`, `startedAt`, `createdAt`
```
id: number
proposalId: number
offerId: number
ordererId: string
runnerId: string
status: MissionStatus
errandFee: number
settlementPaid: boolean
refunded: boolean
resolution: MissionResolution | null
startedAt: string
runnerConfirmedAt, ordererConfirmedAt, disputedAt: string | null
completedAt, failedAt, resolvedAt: string | null
resolvedByAdminId: string | null
settlementPaidAt: string | null
settlementPaidByAdminId: string | null
refundedAt: string | null
refundedByAdminId: string | null
payoutMemo: string | null
createdAt: string
```

**`POST /v1/admin/missions/{mission_id}/resolve`** — Body `MissionResolveRequest { resolution: MissionResolution }` (required)
**`POST /v1/admin/missions/{mission_id}/settlement`** — Body `MissionPayoutRequest { adminId?, memo? } | null` · 수행비 지급 기록
**`POST /v1/admin/missions/{mission_id}/refund`** — Body `MissionPayoutRequest | null` · 환불 기록

셋 다 200 → `MissionResponse`, Error 공통 + `404`, `409`, `400`.

> Refund/Payout 도메인(§6.8, §6.9)은 이 미션 필드들의 **읽기 전용 뷰**다. 실제 상태 변경은 미션 쪽 endpoint에서도, refund/payout 쪽 endpoint에서도 가능하다 — 어느 쪽을 쓸지는 §9 참조.

### 6.7 분쟁 (Dispute)

**`GET /v1/admin/dispute`** — Query: `status?: DisputeProcessStatus[]`, `proposalId?`, `keyword?`, `page`, `size`

`AdminDisputeSummaryResponse` — required: `id`, `proposalId`, `offerId`, `requesterId`, `requesterRole`, `status`, `createdAt`
```
id: number
proposalId: number
offerId: number
missionId: number | null
requesterId: string
requesterName: string | null
requesterRole: string          // enum이 아니라 자유 string
status: DisputeProcessStatus
createdAt: string
```

**`GET /v1/admin/dispute/{dispute_id}`** → `AdminDisputeDetailResponse` = Summary +
```
targetId: string               // required
targetName: string | null
targetRole: string             // required
surveyQuestionId: number       // required
reason: string                 // required
proposalStatus: ProposalStatus // required
offerStatus: OfferStatus       // required
adminNote: string | null
resolvedAt: string | null
```

**`POST /v1/admin/dispute/{dispute_id}/resolve`**
```
AdminDisputeResolveRequest {
  outcome: MissionResolution     // required. 'COMPLETED' | 'FAILED'
  adminNote?: string | null
  adminId?: string | null
}
```
**`POST /v1/admin/dispute/{dispute_id}/reject`** — Body `AdminNoteRequest | null`

둘 다 200 → `AdminDisputeDetailResponse`, Error 공통 + `404`, `409 DISPUTE_ALREADY_REVIEWED`, `400`.

### 6.8 환불 (Refund)

**`GET /v1/admin/refund`** — Query: `status?: PayoutStatus[]`, `requestedFrom?`(`YYYY-MM-DD`), `keyword?`, `page`, `size`

`AdminRefundSummaryResponse` — required: `id`, `proposalId`, `proposalStatus`, `ordererId`, `amount`, `status`, `requestedAt`
```
id: number                     // = 미션 ID
proposalId: number
proposalStatus: ProposalStatus
ordererId: string
ordererName: string | null
amount: number
status: PayoutStatus           // RefundStatus 아님
requestedAt: string
processedAt: string | null
```

**`GET /v1/admin/refund/{refund_id}`** → Summary +
```
reason: string | null
refundBankName: string | null
refundAccountNumber: string | null      // 비마스킹
refundAccountHolder: string | null
adminNote: string | null
```

**`POST /v1/admin/refund/{refund_id}/complete`** / **`.../reject`** — Body `AdminNoteRequest | null` → `AdminRefundDetailResponse`

### 6.9 수행비 지급 (Payout)

**`GET /v1/admin/payout`** — Query: `status?: PayoutStatus[]`, `proposalId?`, `keyword?`, `page`, `size`

`AdminPayoutSummaryResponse` — required: `id`, `proposalId`, `offerId`, `runnerId`, `amount`, `status`
```
id: number                     // = 미션 ID
proposalId: number
offerId: number
runnerId: string
runnerName: string | null
amount: number
status: PayoutStatus
settledAt: string | null
```

**`GET /v1/admin/payout/{payout_id}`** → Summary +
```
payoutBankName: string | null
payoutAccountNumber: string | null      // 비마스킹
payoutAccountHolder: string | null
adminNote: string | null
```

**`POST /v1/admin/payout/{payout_id}/complete`** / **`.../reject`** — Body `AdminNoteRequest | null` → `AdminPayoutDetailResponse`

### 6.10 신고 (ProposalReport)

**`GET /v1/admin/proposal-reports`** — Query: `status?: ProposalReportStatus`, `proposalId?`, `keyword?`, `page`, `size`

`ProposalReportResponse`에 **`proposalStatus`가 추가**됐다. 나머지 필드는 기존과 동일.

**`POST /v1/admin/proposal-reports/{report_id}/accept`** / **`.../reject`** — body 없음, `ProposalReportResponse` 반환

> **승인은 Proposal을 `REPORTED`로 바꾼다. `CANCELLED`가 아니다.** 현재 `ReportInfoTab.tsx`의 "요청도 취소로 변경됩니다" 안내는 사실과 다르다 — §9 참조.

---

## 7. Frontend Types

기존 구조를 따른다: status는 `src/domain/status/`, DTO는 `src/data/api/contracts/`. **Domain↔DTO 분리 계층과 Mapper는 만들지 않는다.**

### 7.1 Status Type — `src/domain/status/`

기존 유지: `proposalStatus.ts`, `offerStatus.ts`, `proposalReportStatus.ts` (**enum 값 변경 없음**)

신규
```ts
// src/domain/status/missionStatus.ts
export const MISSION_STATUSES = ['STARTED','DISPUTED','COMPLETED','PAID','FAILED','REFUNDED'] as const
export type MissionStatus = (typeof MISSION_STATUSES)[number]

export const MISSION_RESOLUTIONS = ['COMPLETED', 'FAILED'] as const
export type MissionResolution = (typeof MISSION_RESOLUTIONS)[number]

// src/domain/status/disputeStatus.ts
export const DISPUTE_PROCESS_STATUSES = ['PENDING', 'RESOLVED', 'REJECTED'] as const
export type DisputeProcessStatus = (typeof DISPUTE_PROCESS_STATUSES)[number]

// src/domain/status/payoutStatus.ts
// Refund와 Payout이 공유한다. RefundStatus를 따로 만들지 않는다.
export const PAYOUT_STATUSES = ['PENDING', 'COMPLETED', 'REJECTED'] as const
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number]
```

`DisputeActorRole`은 **만들지 않는다.** 서버 `requesterRole`/`targetRole`이 enum이 아니라 자유 string이다.

### 7.2 상태 라벨 매핑 — `src/domain/status/statusLabel.ts`

```ts
export type RequestStatusLabel = '미입금' | '대기중' | '진행중' | '완료' | '취소' | '분쟁중'
export type OfferStatusLabel = '대기중' | '선택됨' | '진행중' | '완료' | '취소' | '분쟁중'
export type ProcessStatusLabel = '미처리' | '처리 완료' | '반려'

export function toRequestStatusLabel(status: ProposalStatus): RequestStatusLabel
export function toOfferStatusLabel(status: OfferStatus): OfferStatusLabel
export function toProcessStatusLabel(
  status: ProposalReportStatus | DisputeProcessStatus | PayoutStatus,
): ProcessStatusLabel
export function toMissionStatusLabel(status: MissionStatus): string
```

`toProcessStatusLabel`은 세 union이 `PENDING/ACCEPTED/REJECTED`와 `PENDING/RESOLVED/REJECTED`, `PENDING/COMPLETED/REJECTED`로 값이 갈리므로 union별 분기가 필요하다.

**[미해결]** `toRequestStatusLabel`의 매핑 값은 여전히 확정할 수 없다. `ProposalStatus`/`OfferStatus` enum이 이번 구현에서 바뀌지 않았고, `RESOLVED`·`REPORTED`에 대응하는 UI 라벨이 없다. §9 참조.

`MissionStatus` 6값(`STARTED/DISPUTED/COMPLETED/PAID/FAILED/REFUNDED`)과 현재 미션 화면의 4값(`진행중/완료/취소/분쟁중`)도 일치하지 않는다.

### 7.3 Response Type — `src/data/api/contracts/`

| 파일 | 타입 |
|---|---|
| `adminAuth.ts` *(신규)* | `AdminLoginRequest`, `AuthTokenResponse` |
| `proposal.ts` *(추가)* | `AdminProposalSummaryResponse`, `AdminProposalDetailResponse`, `AdminConfirmPaymentRequest` |
| `offer.ts` *(추가)* | `AdminOfferSummaryResponse` |
| `mission.ts` *(신규)* | `MissionResponse`, `MissionResolveRequest`, `MissionPayoutRequest` |
| `dispute.ts` *(신규)* | `AdminDisputeSummaryResponse`, `AdminDisputeDetailResponse`, `AdminDisputeResolveRequest` |
| `refund.ts` *(신규)* | `AdminRefundSummaryResponse`, `AdminRefundDetailResponse` |
| `payout.ts` *(신규)* | `AdminPayoutSummaryResponse`, `AdminPayoutDetailResponse` |
| `summary.ts` *(신규)* | `AdminSummaryResponse` |
| `adminNote.ts` *(신규)* | `AdminNoteRequest` — 5개 endpoint가 공유 |
| `proposalReport.ts` *(필드 추가)* | `ProposalReportResponse.proposalStatus` |

List Response 전용 타입은 만들지 않고 `PageResponse<T>`를 조합한다.

### 7.4 Request Type

```ts
// contracts/adminAuth.ts
export interface AdminLoginRequest { username: string; password: string }

// contracts/adminNote.ts — cancel, dispute reject, refund/payout complete·reject 공유
export interface AdminNoteRequest { adminNote?: string | null; adminId?: string | null }

// contracts/proposal.ts
export interface AdminConfirmPaymentRequest { openChatUrl: string }

// contracts/dispute.ts
export interface AdminDisputeResolveRequest {
  outcome: MissionResolution
  adminNote?: string | null
  adminId?: string | null
}

// contracts/mission.ts
export interface MissionResolveRequest { resolution: MissionResolution }
export interface MissionPayoutRequest { adminId?: string | null; memo?: string | null }
```

### 7.5 Query Type — `src/data/api/adminApi.ts`

```ts
export interface AdminPageParams { page?: number; size?: number; keyword?: string }

export interface ListAdminProposalsParams extends AdminPageParams { status?: ProposalStatus[] }
export interface ListAdminOffersParams extends AdminPageParams {
  proposalId?: number; status?: OfferStatus[]; accepted?: boolean; hasDispute?: boolean
}
export interface ListAdminMissionsParams { status?: MissionStatus[]; page?: number; size?: number }
export interface ListAdminDisputesParams extends AdminPageParams {
  status?: DisputeProcessStatus[]; proposalId?: number
}
export interface ListAdminRefundsParams extends AdminPageParams {
  status?: PayoutStatus[]; requestedFrom?: string
}
export interface ListAdminPayoutsParams extends AdminPageParams {
  status?: PayoutStatus[]; proposalId?: number
}
export interface ListProposalReportsParams extends AdminPageParams {
  status?: ProposalReportStatus; proposalId?: number
}
```

`ListAdminMissionsParams`만 `keyword`가 없다 — 서버가 미션 목록에 키워드 검색을 제공하지 않는다.

**`httpClient.RequestConfig.query`가 배열을 받지 못한다.** 현재 타입이 `Record<string, string | number | boolean | undefined>`이라 `status=A&status=B` 반복 파라미터를 만들 수 없다. 배열 허용 + `buildUrl`에서 `append` 처리가 필요하다.

### 7.6 Domain Type

Domain Entity 계층을 만들지 않는다. Domain에는 status union과 §7.2 라벨 매핑 함수만 둔다.

### 7.7 Presentation 전용 값 (API Response에 없음)

한글 상태 라벨, `formatAmount`/`formatCount` 결과, `payoutRequired`·`refundRequired`·`canCancel` 같은 계산 boolean, 대시보드 카드의 `label`/`hint`는 전부 Presentation에서 만든다.

`DemoOffer.selected`는 서버 `accepted: boolean`으로 대체된다.

---

## 8. File Plan

### 신규
| 파일 | 역할 |
|---|---|
| `src/domain/status/missionStatus.ts` | `MissionStatus`, `MissionResolution` |
| `src/domain/status/disputeStatus.ts` | `DisputeProcessStatus` |
| `src/domain/status/payoutStatus.ts` | `PayoutStatus` (Refund 공유) |
| `src/domain/status/statusLabel.ts` | 서버 enum → UI 라벨 매핑 (**Q2 미해결 부분 제외**) |
| `src/data/api/contracts/adminAuth.ts` | 로그인 DTO |
| `src/data/api/contracts/adminNote.ts` | `AdminNoteRequest` |
| `src/data/api/contracts/mission.ts` | 미션 DTO |
| `src/data/api/contracts/dispute.ts` | 분쟁 DTO |
| `src/data/api/contracts/refund.ts` | 환불 DTO |
| `src/data/api/contracts/payout.ts` | 수행비 지급 DTO |
| `src/data/api/contracts/summary.ts` | `AdminSummaryResponse` |

### 수정
| 파일 | 변경 |
|---|---|
| `src/data/api/contracts/proposal.ts` | Admin Summary/Detail Response, `AdminConfirmPaymentRequest` 추가 |
| `src/data/api/contracts/offer.ts` | `AdminOfferSummaryResponse` 추가 |
| `src/data/api/contracts/proposalReport.ts` | `proposalStatus` 추가 |
| `src/data/api/apiError.ts` | `ErrorCode`에 신규 6개 추가 — `ADMIN_CREDENTIALS_INVALID`, `DISPUTE_ALREADY_REVIEWED`, `MISSION_NOT_FOUND`, `MISSION_NOT_REFUNDABLE`, `MISSION_NOT_RESOLVABLE`, `MISSION_NOT_SETTLEABLE` |
| `src/data/api/adminApi.ts` | 신규 endpoint 함수 + Query Param interface. `confirm-payment`에 body 전달. `resolveOffer` **삭제**(서버에서 제거됨) |
| `src/data/api/httpClient.ts` | `query`에 배열 허용 + 반복 파라미터 `append`. `setAuthTokenProvider`를 관리자 세션에 연결 |
| `src/presentation/auth/` | 데모 자격 증명 → 실제 로그인 API 연동 |
| `src/presentation/pages/requests/tabs/ReportInfoTab.tsx` | 신고 승인 결과를 `REPORTED`로 정정 (현재 "취소" 안내는 오류) |

### 삭제 대상 (연동 완료 후)
`src/presentation/demo/` 전체 — `demoAuth.ts` 포함

---

## 9. 남은 결정 사항

구현으로 대부분 해소됐고, 아래 5건이 남았다.

### 9.1 상태 매핑 (미해결 · FE 블로커)

`ProposalStatus` 10값·`OfferStatus` 8값이 그대로다. 관리자 화면은 각각 6값만 쓴다.

| 서버 | UI 후보 | 상태 |
|---|---|---|
| `HOLDING` | 미입금 | 유력 |
| `POSTED` / `OFFERED` | 대기중 | 둘이 같은 라벨로 접히는지 확인 필요 |
| `MATCHED` / `ORDER_COMPLETED` | 진행중 | `ORDER_COMPLETED`가 완료인지 확인 필요 |
| `ALL_COMPLETED` | 완료 | 유력 |
| `DISPUTED` | 분쟁중 | 유력 |
| `CANCELLED` | 취소 | 유력 |
| `RESOLVED` | — | **대응 라벨 없음** |
| `REPORTED` | — | **대응 라벨 없음** |

`MissionStatus` 6값 ↔ 미션 화면 4값(`진행중/완료/취소/분쟁중`)도 같은 문제다. **`PAID`와 `REFUNDED`의 화면 표현이 정해져야 한다.**

### 9.2 `depositorName` (제품 결정 필요)

서버가 필드는 내려주지만 값을 만드는 흐름이 없어 **항상 `null`** 이다. 현재 입금 확인 모달은 입금자명을 계좌와 대조하는 UI다.

→ 입금자명을 어디서 받을지 정하거나, UI에서 제거해야 한다.

### 9.3 신고 승인 결과 (FE 수정 필요)

승인은 Proposal을 **`REPORTED`** 로 바꾼다. `CANCELLED`가 아니다. `ReportInfoTab.tsx`의 안내 문구와 `→ 취소` 전이 배지가 사실과 다르므로 고쳐야 한다.

### 9.4 지원 메시지 필드 없음

`AdminOfferSummaryResponse`에 `message`가 없다. 요청 상세의 지원 상세 Modal이 지원 메시지를 표시하는데 데이터 출처가 없다.

→ 서버에 추가를 요청하거나, UI에서 제거해야 한다.

### 9.5 Mission vs Refund/Payout — 어느 endpoint로 쓸지

같은 상태를 두 경로로 바꿀 수 있다.

- `POST /v1/admin/missions/{id}/settlement` · `.../refund`
- `POST /v1/admin/payout/{id}/complete` · `POST /v1/admin/refund/{id}/complete`

`id`가 같은 미션 ID이므로 결과는 같아 보이지만, 반려(`reject`)는 payout/refund 쪽에만 있다. **FE는 payout/refund 쪽으로 통일하는 것을 권한다** — 완료와 반려가 같은 도메인 경로에 있어 화면 흐름과 맞는다.
