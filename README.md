# Harness Engineering Architecture

이 프로젝트는 **Claude Code와 Codex가 동일한 개발 규칙을 공유하면서**, 필요한 컨텍스트만 선택적으로 읽고, 구현 → 검증 → 수정 루프를 반복할 수 있도록 Harness Engineering 구조를 사용합니다.

핵심 목표는 다음과 같습니다.

- Claude와 Codex의 개발 규칙 통일
- 프로젝트 규칙의 Single Source of Truth 유지
- 필요한 컨텍스트만 읽는 Progressive Disclosure
- Planner → Implementer → Reviewer 기반 개발 흐름
- Typecheck / Lint / Build 기반 자동 검증
- 반복 실수를 Harness 규칙으로 축적하는 Evolution Harness
- 불필요한 Agent 호출과 컨텍스트 로딩을 줄여 토큰 사용량 최소화

---

## 1. 전체 Harness Architecture

프로젝트 규칙의 원본은 `.harness/`에 둡니다.

`CLAUDE.md`, `.claude/`, `AGENTS.md` 등은 각 AI 런타임이 공통 Harness를 사용할 수 있도록 연결하는 Adapter 역할만 담당합니다.

```text
                 .harness/
          Single Source of Truth
                    │
       ┌────────────┴────────────┐
       │                         │
   Claude Code                 Codex
       │                         │
   CLAUDE.md                  AGENTS.md
   .claude/...                 Codex adapter
       │                         │
       └──────── 같은 규칙 ──────┘
                    │
          ┌─────────┴─────────┐
          │                   │
     Context Harness     Workflow Harness
 presentation/domain/    plan → implement
 data 필요한 것만        → review
          │                   │
          └─────────┬─────────┘
                    ↓
            Verification Harness
         typecheck / lint / build
                    │
              FAIL │ PASS
                    │
          수정 ←───┘ → 완료
                    │
                    ↓
             Evolution Harness
          반복 실수 → 공통 규칙 개선
                    │
                    └──→ Claude + Codex 동시 적용
```

### 구성 요소

#### Single Source of Truth

프로젝트의 실제 개발 규칙은 `.harness/`에서 관리합니다.

예:

```text
.harness/
├── rules/
│   ├── architecture.md
│   ├── presentation.md
│   ├── domain.md
│   ├── data.md
│   ├── verification.md
│   └── git.md
│
├── workflows/
│   ├── lightweight.md
│   ├── standard.md
│   └── high-risk.md
│
└── evolution/
    ├── learnings.md
    └── changelog.md
```

Claude와 Codex에 동일한 규칙을 중복 작성하지 않습니다.

---

## 2. 개발 실행 Framework

기능 개발은 기본적으로 **Planner → Implementer → Reviewer** 흐름을 사용합니다.

작업에 필요한 아키텍처 레이어의 규칙만 선택적으로 읽습니다.

```text
                 사용자 요청
                     │
                     ▼
              Root AGENTS.md
              프로젝트 전체 규칙
                     │
                     ▼
                  Planner
             "어디를 수정해야 하지?"
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
 Presentation     Domain        Data
 AGENTS.md        AGENTS.md     AGENTS.md
 필요한 것만 읽음
         └───────────┬───────────┘
                     ▼
               Implementer
                코드 구현
                     │
                     ▼
                 Reviewer
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    typecheck       lint         build
        │            │            │
        └────────────┼────────────┘
                     ▼
              요구사항 검토
                     │
             ┌───────┴───────┐
             │               │
           FAIL             PASS
             │               │
       Implementer          완료
          수정
             │
             └──→ Reviewer
```

### Planner

Planner는 실제 소스를 수정하지 않습니다.

주요 책임:

- 요구사항 분석
- 영향 범위 파악
- 관련 레이어 결정
- 관련 파일 탐색
- 필요한 Harness 규칙 선택
- 구현 계획 작성
- 미확인 API / 상태값 / 권한 / Contract 식별

이미 Harness에 확정되어 있는 프로젝트 정보를 반복해서 조사하지 않습니다.

### Implementer

Implementer는 실제 애플리케이션 코드를 수정합니다.

주요 책임:

- Planner의 계획에 따라 구현
- 선택된 Layer Rule 준수
- 기존 코드 스타일 유지
- API / 상태값 / Contract 추측 금지
- Reviewer의 수정 요청 반영

### Reviewer

Reviewer는 구현 결과를 독립적으로 검증합니다.

주요 책임:

- 변경 diff 확인
- 요구사항 충족 여부 확인
- Architecture Rule 위반 확인
- API 추측 여부 확인
- typecheck
- lint
- build
- 필요한 경우 test

Reviewer는 소스 코드를 직접 수정하지 않습니다.

문제가 있으면 `FIX_REQUIRED`로 판단하고 Implementer에게 되돌립니다.

---

## 3. Context Harness

Context Harness는 **AI가 필요한 규칙만 읽게 하는 구조**입니다.

기본 레이어는 다음 세 가지입니다.

```text
presentation
domain
data
```

### Presentation

React UI 레이어입니다.

담당:

- Page
- Component
- Routing
- 사용자 입력
- 화면 상태
- Loading / Empty / Error UI
- 사용자 피드백

주요 원칙:

- Component에서 API endpoint 직접 호출 금지
- 비즈니스 규칙을 UI에 직접 구현하지 않음
- 서버 DTO를 임의로 추측하지 않음
- 상태 전이 규칙을 UI에 중복 구현하지 않음

### Domain

플랫폼 독립적인 비즈니스 규칙을 담당합니다.

담당:

- Domain Model
- 상태
- 상태 전이
- Validation
- 비즈니스 판단
- 순수 TypeScript 로직

주요 원칙:

- React 의존 금지
- Presentation 의존 금지
- API Client 의존 금지
- Data Layer 의존 금지
- 상태값과 비즈니스 규칙 추측 금지
- 가능한 한 순수 TypeScript로 작성

### Data

서버 및 외부 데이터 통신을 담당합니다.

담당:

- API Client
- Endpoint
- Request / Response DTO
- Mapper
- API Error 처리

주요 원칙:

- 존재하지 않는 Endpoint 추측 금지
- Response Field 추측 금지
- 서버 상태값 추측 금지
- API Base URL 하드코딩 금지
- Component에서 직접 fetch 금지
- Contract 확인이 불가능하면 구현 중단 후 확인 요청

---

## 4. Progressive Disclosure

모든 작업에서 전체 Harness 문서를 읽지 않습니다.

작업 유형에 따라 필요한 문서만 사용합니다.

```text
UI 수정
→ Root + Presentation

API 수정
→ Root + Data

비즈니스 규칙 수정
→ Root + Domain

API + UI
→ Root + Data + Presentation

Domain까지 영향을 주는 작업
→ Root + 필요한 Layer + Domain
```

관련 없는 Layer 문서는 읽지 않습니다.

---

## 5. Workflow Harness

Harness는 작업 위험도에 따라 실행 강도를 조절합니다.

### Lane A — Lightweight

대상:

- 문구 수정
- 작은 CSS 수정
- 아이콘 변경
- 단일 파일 소규모 수정

흐름:

```text
Implementer
→ Verification
```

Planner를 생략합니다.

### Lane B — Standard

대상:

- 새로운 화면
- 일반 Feature
- API 연동
- Component 추가

흐름:

```text
Planner
→ Implementer
→ Reviewer
```

### Lane C — High Risk

대상:

- 인증
- 권한
- 상태 전이
- Architecture 변경
- 데이터 Contract 변경
- 대규모 Refactoring
- 여러 Layer에 걸친 변경

흐름:

```text
Planner
→ Implementer
→ Reviewer
→ 강화된 Verification
```

애매하면 더 높은 Lane을 선택합니다.

---

## 6. Verification Harness

AI의 "완료했습니다"라는 응답을 완료 기준으로 사용하지 않습니다.

기계적인 Gate를 통과해야 합니다.

기본 검증:

```text
typecheck
lint
build
```

테스트 환경이 존재하면:

```text
test
```

도 추가합니다.

### 완료 조건

```text
typecheck PASS
+
lint PASS
+
build PASS
+
요구사항 검토 PASS
=
DONE
```

하나라도 실패하면 완료 처리하지 않습니다.

### 실패 시

```text
Reviewer
  ↓
FIX_REQUIRED
  ↓
Implementer 수정
  ↓
Reviewer 재검증
```

검증되지 않은 영역은 `PASS`라고 표현하지 않습니다.

---

## 7. Evolution Harness

Harness는 고정된 규칙집이 아닙니다.

개발 중 반복적으로 발생하는 실수나 새롭게 확정된 프로젝트 규칙을 Harness에 반영합니다.

```text
실수 발생
   ↓
원인 분석
   ↓
재발 가능성 판단
   ↓
Rule 추가 필요?
   ↓
적절한 Scope에 Rule 반영
   ↓
Claude + Codex 모두 다음 작업부터 적용
```

### Rule Promotion 기준

다음과 같은 경우 영구 Rule 추가를 고려합니다.

- 동일 실수가 반복됨
- 심각한 장애 가능성이 있음
- Architecture 위반 가능성이 큼
- 보안 또는 데이터 손상 위험이 있음
- 프로젝트 전체에 반복 적용되는 결정이 확정됨

일회성 실수는 무조건 Harness Rule로 승격하지 않습니다.

### Rule Scope

가장 좁은 범위에 Rule을 둡니다.

```text
UI 전용 규칙
→ Presentation

API 전용 규칙
→ Data

비즈니스 규칙
→ Domain

프로젝트 전체 규칙
→ Root / Global
```

---

## 8. Claude Code / Codex 일관성

Claude와 Codex의 실행 방식은 달라도 됩니다.

하지만 아래 규칙은 반드시 동일해야 합니다.

- Architecture
- Dependency Rule
- API Rule
- TypeScript Rule
- Verification Gate
- 완료 판정 기준
- Git / Commit Rule
- PR Rule
- Lane 기준
- Evolution Rule

구조:

```text
                  Shared Harness
                       │
                   .harness/
                       │
          ┌────────────┴────────────┐
          │                         │
     Claude Code                  Codex
          │                         │
      CLAUDE.md                  AGENTS.md
      .claude/...                Codex Adapter
```

`CLAUDE.md`와 `AGENTS.md`는 규칙의 원본이 아닙니다.

둘 다 `.harness/`를 가리키는 Adapter / Router 역할을 합니다.

---

## 9. Harness의 4가지 축

이 프로젝트의 Harness Engineering은 다음 네 가지 축으로 구성됩니다.

### ① Context Harness

```text
Root
Presentation
Domain
Data
```

필요한 컨텍스트만 선택적으로 사용합니다.

### ② Workflow Harness

```text
Planner
→ Implementer
→ Reviewer
```

작업의 실행 순서를 통제합니다.

### ③ Verification Harness

```text
Typecheck
+
Lint
+
Build
+
요구사항 검토
```

코드가 실제 기준을 통과했는지 검증합니다.

### ④ Evolution Harness

```text
반복 실수
→ 원인 분석
→ Rule 개선
→ Shared Harness 반영
→ Claude / Codex 동시 적용
```

Harness가 실제 프로젝트와 함께 발전하도록 합니다.

---

## 10. 핵심 원칙

이 프로젝트에서 Harness Engineering의 목적은 AI에게 더 긴 프롬프트를 제공하는 것이 아닙니다.

목적은 AI가 **예측 가능한 방식으로 개발하도록 환경을 설계하는 것**입니다.

```text
좋은 Prompt
     ↓
좋은 코드
```

에 의존하지 않고,

```text
작은 Context
     +
명확한 역할
     +
Architecture Rule
     +
자동 Verification
     +
실패 → 수정 Loop
     +
Evolution
     ↓
일관된 개발 결과
```

를 목표로 합니다.
