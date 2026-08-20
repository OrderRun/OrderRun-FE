---
name: orderrun-dev
description: "OrderRun-FE(꼬붕단 관리자 웹) 기능 개발 오케스트레이터. 계획 → 구현 → 리뷰·검증 → 수정 → 재검증 → 완료 루프를 조율한다. 새 기능·화면·컴포넌트 구현, 기존 코드 수정, 버그 수정, 리팩터링 요청에 반드시 사용. 후속 작업에도 사용: 다시 실행, 재실행, 이어서, 수정, 보완, 업데이트, 리뷰 지적 반영, 검증만 다시, 계획만 다시, 이전 결과 개선. Request/Application/Mission/Dispute 등 관리자 기능 개발 요청에도 사용. 단순 질문이나 코드 읽기만 필요한 경우에는 사용하지 않는다."
---

# OrderRun-FE Development Orchestrator

목적은 하나다: **검증되지 않은 코드가 "완료"로 선언되는 것을 막는 것.** 그 목적을 최소 호출·최소 컨텍스트로 달성한다.

## 실행 모드

팀 도구(`TeamCreate`/`TaskCreate`)가 없는 환경이다. `Agent`로 스폰하고, 수정 라운드는 **`SendMessage`로 기존 구현 에이전트를 재개**한다 — 새로 스폰하면 컨텍스트를 잃고 전면 재작성이 발생한다. 스폰 직후 `ListAgents`로 식별자를 확인해 기록해 둔다. 모든 호출에 `model: "opus"`.

## 에이전트 3인

| 에이전트 | subagent_type | 쓰기 범위 | 역할 | 산출물 |
|---|---|---|---|---|
| planner | `general-purpose` | `_workspace/{slug}/`만 | 요구사항 확정 + 관련 코드 조사 + 구현 계획 | `plan.md` (≤80줄) |
| feature-implementer | `feature-implementer` | `src/` + `_workspace/{slug}/` | 구현 및 수정 | 코드 + `impl.md` (≤30줄) |
| reviewer | `general-purpose` | `_workspace/{slug}/`만 | 검증 실행 + 계획 대비 리뷰 + 요구사항 누락 확인 | `review_r{N}.md` (≤40줄) |

**소스를 만지는 에이전트는 implementer 하나뿐이다.** planner와 reviewer는 리포트만 쓴다.

**소스 무변경 가드:** planner / reviewer 호출 **직전에** 베이스라인을 캡처하고 완료 직후 다시 캡처해 비교한다.

```
git status --porcelain -- src package.json tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js index.html
```

두 스냅샷이 다르면 판정 단계에서 소스가 바뀐 것이므로 그 라운드 판정을 무효 처리하고 사용자에게 보고한다. 워킹 트리가 이미 dirty한 것 자체는 위반이 아니다 — 반드시 **호출 직전에 직접 캡처한 스냅샷**과 비교한다.

## 토큰 규율

- **읽기 목록은 `plan.md`가 정한다.** planner가 "관련 파일"을 확정하면 implementer와 reviewer는 그 목록 + 변경 파일만 읽는다. 코드베이스 전체를 재탐색시키지 않는다
- **프로젝트 기본 정보는 재조사하지 않는다.** 스택·컴파일러 제약·검증 명령은 `.claude/skills/feature-development/references/project-conventions.md`에 확정되어 있다. 새 의존성이 필요하거나 문서가 실제와 다르다고 의심될 때만 원본 설정 파일을 연다
- **중복 기록 금지.** `impl.md`는 계획을 되풀이하지 않고, `review_r{N}.md`는 코드를 붙여넣지 않는다. 문서는 결정·변경·실패만 담는다
- **검증 로그를 컨텍스트에 넣지 않는다.** exit code와 에러 줄만 기록한다
- **반환값은 짧게.** 각 에이전트는 산출물 경로 + 판정 + 다음 행동만 반환한다. 산출물 내용을 반환값에 반복하지 않는다

## 워크플로우

### Phase 0: 컨텍스트 확인 + 레인 선택

1. slug 결정 (예: `mission-list`)
2. `_workspace/{slug}/` 존재 여부로 분기:

| 상황 | 모드 |
|---|---|
| 없음 | 초기 실행 → Phase 1 |
| 있음 + 부분 수정 요청 ("리뷰 지적 반영", "검증만 다시", "계획만 다시") | 부분 재실행 → 해당 Phase만. **기존 산출물 경로를 프롬프트에 포함** |
| 있음 + 새 요구사항 | 새 실행 → 기존 디렉토리를 `_workspace/{slug}_{YYYYMMDD_HHMMSS}/`로 이동 후 Phase 1 |

3. **레인 선택** — 불필요한 호출을 줄이되 게이트는 절대 건너뛰지 않는다:

| 레인 | 조건 | 호출 |
|---|---|---|
| **A (경량, 2회)** | 단일 파일, 새 파일 없음, 새 의존성 없음, 데이터 계약·타입 변경 없음 (문구·상수값·스타일·간단한 버그 수정) | implementer → reviewer |
| **B (표준, 3회)** | 그 외 전부 — 새 파일, 새 타입, 데이터 흐름 변경, 화면 추가 | planner → implementer → reviewer |

레인 A에서는 `plan.md` 대신 **요구사항 한 줄과 대상 파일 경로**를 implementer 프롬프트에 직접 넣는다. 판단이 애매하면 B를 쓴다 — 잘못된 A 선택은 구조 붕괴로 이어지고, 잘못된 B 선택은 호출 한 번을 더 쓸 뿐이다.

### Phase 1: 계획 (레인 B만)

```
Agent(subagent_type: "general-purpose", model: "opus", description: "조사 및 계획",
  prompt: ".claude/agents/planner.md와 .claude/skills/feature-development/SKILL.md의 A장을 읽고 따르라.
           _workspace/ 밖의 파일은 절대 수정하지 마라.
           요구사항: {원문}
           산출물: _workspace/{slug}/plan.md (80줄 이내)
           반환값: 산출물 경로 / 확인 필요 항목 / 새 의존성 / 신규 파일 수. 계획 내용은 반복하지 마라.")
```

**게이트 A:** 반환값에 다음이 있으면 구현으로 넘어가지 않는다.
- 구현 방향을 바꾸는 확인 필요 항목(API 스키마, 상태 값, 권한 규칙, 화면 이동 경로) → **사용자에게 질문.** 답변은 `plan.md`의 전제 표에 planner가 반영한다 (별도 문서를 만들지 않는다)
- `package.json`에 없는 라이브러리 → **설치 승인 없이 진행 금지**
- 파일 수가 요구사항 대비 과도 → 계획 축소 지시. 단, lint가 강제한 분리는 축소 대상이 아니다

### Phase 2: 구현

```
Agent(subagent_type: "feature-implementer", model: "opus", description: "기능 구현",
  prompt: ".claude/agents/feature-implementer.md와 .claude/skills/feature-development/SKILL.md의 B장을 읽고 따르라.
           입력: _workspace/{slug}/plan.md   ← 레인 A는 대신 '{요구사항 한 줄} / 대상 파일: {경로}'
           계획의 '관련 파일'과 수정 대상 파일만 읽어라. 코드베이스 전체를 훑지 마라.
           산출물: 코드 + _workspace/{slug}/impl.md (30줄 이내)
           자체 검증 3종을 통과시킨 뒤 보고하라. 로그 전문은 읽지 마라.")
```

스폰 직후 `ListAgents`로 식별자를 기록한다. Phase 4가 이 식별자로 재개한다.

### Phase 3: 리뷰 + 검증 (단일 호출)

```
Agent(subagent_type: "general-purpose", model: "opus", description: "리뷰 및 검증",
  prompt: ".claude/agents/reviewer.md와 .claude/skills/review-and-verify/SKILL.md를 읽고 따르라.
           코드를 고치지 마라. _workspace/의 리뷰 리포트 외에는 아무 파일도 쓰지 마라.
           대상: _workspace/{slug}/, 라운드 {N}
           검증을 먼저 실행하고 리뷰를 붙여 하나의 판정으로 통합하라.
           변경된 파일만 읽어라. 검증 로그 전문을 읽지 마라.
           산출물: _workspace/{slug}/review_r{N}.md (40줄 이내)
           반환값: PASS 또는 FIX_REQUIRED + 검증 exit code + 지적 요약 + 미검증 항목")
```

리뷰와 검증을 한 에이전트가 맡으므로 **라운드당 호출은 1회**이고, 지적과 검증 실패가 자동으로 한 묶음이 된다.

### Phase 4: 수정 루프 (최대 3라운드)

FIX_REQUIRED이면 **기존 구현 에이전트를 재개**한다. 새로 스폰하지 않는다.

```
SendMessage(to: "{Phase 2에서 기록한 식별자}", summary: "round {N} 수정 지시",
  message: "라운드 {N} 판정 결과다. 지적된 항목만 수정하라. 전면 재작성 금지.
            리포트: _workspace/{slug}/review_r{N}.md
            각 항목에 '수정함 / 반박함(근거) / 계획 변경 필요' 중 하나로 답하라.
            수정 후 자체 검증 3종을 실행하고 impl.md의 해당 라운드 섹션만 갱신하라.")
```

수정 보고를 받으면 라운드를 올려 Phase 3 재실행 (`review_r{N+1}.md`, 이전 라운드 덮어쓰기 금지).

| 상황 | 처리 |
|---|---|
| 3라운드 후 미해결 | 계획 결함 가능성 → Phase 1 재수립 또는 사용자 에스컬레이션 |
| 구현자가 근거 있게 반박 | reviewer에게 전달해 재판정. 오케스트레이터가 임의 기각하지 않는다 |
| 같은 지적 3라운드 반복 | 규칙이 모호하다는 신호 → Phase 6에서 컨벤션에 규칙 추가 |
| 실패 원인이 환경·설정 | 설정 완화 금지. 사용자 보고 |

### Phase 5: 완료 판정

**모두 참일 때만 완료를 선언한다.**

- [ ] 검증 3종 exit code 전부 0
- [ ] 리뷰 판정 PASS (BLOCKER 0, MAJOR 0)
- [ ] 계획의 경계 상태 표 각 행이 구현되었음을 리뷰가 확인
- [ ] 계획의 완료 판정 기준(요구사항)에 누락이 없음을 리뷰가 확인
- [ ] **미검증 항목을 사용자에게 그대로 보고** (테스트 미도입, 런타임 동작, 읽지 못한 파일)

하나라도 미충족이면 완료라고 말하지 않는다. **미검증 영역은 PASS로 취급하지 않는다.**

사용자 보고: 변경 파일 목록 / 검증 exit code / 남은 MINOR / 미검증 항목 / 미확정 전제.

### Phase 6: 하네스 갱신 (반영할 것이 있을 때만)

| 발견 | 반영 위치 |
|---|---|
| 새 규칙, 반복된 지적, 확정된 미확정 항목, 낡은 사실 진술 | `.claude/skills/feature-development/references/project-conventions.md` (본문 + 로그) |
| 리뷰 체크리스트 누락 | `.claude/skills/review-and-verify/SKILL.md` |
| 새 검증 명령 (예: `test` 도입) | `review-and-verify/SKILL.md` 게이트 표 + `project-conventions.md` 검증 표 (두 곳뿐) |
| 역할 경계·워크플로우 문제 | 해당 `.claude/agents/*.md` 또는 본 문서 |

변경했으면 `CLAUDE.md` 변경 이력에 한 줄. 반영할 것이 없으면 아무것도 하지 않는다 — 억지 갱신은 하네스를 비대하게 만든다.

`_workspace/`는 삭제하지 않는다 (git 무시됨).

## 데이터 흐름

```
요구사항 ─(레인 B)→ [planner] → plan.md → 게이트 A (확인 필요/의존성 → 사용자)
                                    ↓
         (레인 A: 요구사항 한 줄 + 대상 파일)
                                    ↓
                        [implementer] → src/ + impl.md
                                    ↓
                        [reviewer] 검증 → 리뷰 → review_r{N}.md
                                    ↓
                        PASS? ─No→ SendMessage → [implementer 재개] ─┐
                          │                                          │
                         Yes                        라운드 {N+1} ────┘ (최대 3)
                          ↓
                    Phase 5 완료 판정 → Phase 6 갱신
```

## 에러 핸들링

| 상황 | 전략 |
|---|---|
| 에이전트 실패/중단 | 1회 재시도. 재실패 시 **게이트를 건너뛰지 않고** 사용자에게 보고 |
| 구현자 3회 실패 | 계획 재검토 또는 에스컬레이션 |
| 리뷰어 ↔ 구현자 충돌 | 근거를 가진 쪽 채택. 양쪽 다 근거가 있으면 사용자 결정 |
| 검증 실패가 환경 원인 | `npm install` 등 복구 시도. 의존성 버전·설정은 임의 변경 금지 |
| 계획에 없는 라이브러리 필요 | 설치하지 말고 승인 요청 |
| 요구사항이 진행 중 변경 | Phase 0의 "새 실행"으로 처리. 산출물을 섞지 않는다 |

## 테스트 시나리오

**정상 (레인 B):** 요구사항 → planner가 확인 필요 항목 보고 → 게이트 A에서 사용자 확인 → 구현 → reviewer 1회 호출로 검증 PASS + 리뷰 PASS → 완료 보고(미검증 항목 포함). **에이전트 호출 3회.**

**에러:** reviewer가 검증 FAIL(lint 2건) + BLOCKER 1건(빈 목록 상태 누락)을 한 리포트로 반환 → SendMessage로 구현자 재개 → 한 라운드에 둘 다 수정 → 라운드 2에서 PASS. **총 호출 4회 + 재개 1회.**

**완료 금지:** 검증 typecheck exit 2, 리뷰 지적 0건 → **PASS 아님.** Phase 4로 진입한다.
