# OrderRun-FE Shared Root Harness

이 문서는 Claude Code와 Codex가 함께 사용하는 프로젝트 전역 규칙의 단일 원본이다.
루트 `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.codex/`는 이 공통 Harness를 실행하는
Adapter이며 여기의 역할·Lane·판정 기준을 변경하거나 복사해 별도 규칙으로 만들 수 없다.

## 프로젝트 지도

꼬붕단 관리자 웹. React 19 + TypeScript 6 + Vite 8을 사용한다. ESLint는
`--max-warnings 0`이며 테스트 러너, 라우터, 서버 상태관리, API/UI 라이브러리는
아직 도입되지 않았다. 설정이 바뀌었다는 근거가 있거나 새 의존성이 필요할 때만
원본 설정을 다시 조사한다.

| 관심사 | 선택 Context Harness |
|---|---|
| Page, Component, CSS, 사용자 입력, 화면 상태 | `context/presentation/AGENTS.md` |
| 비즈니스 규칙, 검증, 상태 전이, 순수 계산 | `context/domain/AGENTS.md` |
| API, DTO, mapper, 외부 데이터·오류 | `context/data/AGENTS.md` |
| API 결과를 UI에 연결 | Data + Presentation |
| 여러 레이어에 영향 | 영향받는 모든 Context, Lane C |

Lane B/C에서는 Planner가, Lane A와 독립 검증에서는 오케스트레이터가 요구사항과
대상 파일을 근거로 필요한 Context만 선택한다. 관련 없는 Context 문서는 읽지 않는다.
선택 결과는 plan 또는 lightweight/review 입력에 기록해 후속 역할이 재탐색하지 않게 한다.

## Architecture와 Dependency Rule

| Layer | 책임 | 위치 |
|---|---|---|
| Presentation | React UI, interaction, routing, 화면 상태와 피드백 | `src/presentation/` |
| Domain | 플랫폼 독립 비즈니스 모델·판단·검증·상태 전이 | `src/domain/` |
| Data | API client, request/response DTO, mapper, API 오류 처리 | `src/data/` |

진입점 `src/main.tsx`, `src/App.tsx`, 전역 스타일은 레이어 밖에 둔다. 레이어
디렉토리는 첫 파일이 생길 때 만들고, 새 파일은 책임에 해당하는 레이어 디렉토리
안에만 만든다. 위치가 애매하면 추측하지 말고 plan에서 확정한다.

허용 방향은 Presentation → Domain, Presentation → Data, Data → Domain이다.
Domain → Presentation/Data와 순환 의존성은 금지한다. 현재 책임이 없는 레이어나
Repository/UseCase/Entity/Service를 형식적으로 만들지 않는다.

## 전역 불변식

- 실제 애플리케이션·프로젝트 구현 파일은 Implementer만 수정한다. Planner와
  Reviewer는 `_workspace/{slug}/`의 지정 산출물 외에는 쓰지 않는다.
- API endpoint, DTO field, 서버 상태값, 권한, route, 비즈니스 규칙을 추측하지 않는다.
  구현 방향에 영향을 주는 근거가 없으면 Implementer 전에 사용자에게 확인한다.
- 새 의존성은 승인 없이 설치하지 않는다.
- TypeScript strict를 유지하고 type-only import는 `import type`을 사용한다. `enum`,
  `namespace`, 생성자 parameter property를 쓰지 않는다. `any`, 근거 없는 `as`,
  `@ts-ignore`, `eslint-disable`로 실패를 숨기지 않는다.
- 전체 코드베이스와 모든 Harness 문서를 매번 읽지 않는다. 검색 결과, plan의 관련
  파일, 변경 파일과 직접 연결된 경계만 읽는다.
- 인계 문서는 결정·변경·실패만 짧게 기록하고 전체 로그·코드·앞 문서를 반복하지 않는다.

## Workflow Harness

Canonical 역할은 다음 세 문서에만 정의한다.

- `roles/planner.md`
- `roles/implementer.md`
- `roles/reviewer.md`

| Lane | 기준 | 흐름 |
|---|---|---|
| A — Lightweight | 단일 기존 파일의 명확한 문구/CSS/아이콘/소규모 수정. 새 파일·계약·타입·의존성 없음 | Implementer → Reviewer |
| B — Standard | 화면, Component, API 연동, 새 타입 등 일반 기능 또는 애매한 변경 | Planner → Implementer → Reviewer |
| C — High Risk | 인증·권한·상태 전이·계약·Architecture·다중 Layer·대규모 refactor | Planner → Implementer → Reviewer → 강화 검증 |

불확실하면 높은 Lane을 선택한다. 실행 세부는 `workflows/`의 해당 문서만 읽는다.
FIX_REQUIRED이면 같은 Implementer가 지적만 수정하고 Reviewer가 재검증한다.

역할 산출물은 `_workspace/{slug}/`에 둔다. slug는 오케스트레이터가 요구사항 기준으로
정하며, 디렉토리가 없으면 초기 실행이다. 이미 있으면 같은 요구사항의 부분 재실행
(리뷰 지적 반영, 검증만, 계획만)일 때 기존 산출물 경로를 프롬프트에 넣어 해당 단계만
다시 실행하고, 새 요구사항일 때는 기존 디렉토리를 `_workspace/{slug}_{YYYYMMDD_HHMMSS}/`
로 옮긴 뒤 새로 시작한다. 기존 plan·impl·review 파일은 덮어쓰거나 삭제하지 않는다.

Planner와 Reviewer 호출 전후에는 `rules/mutation-guard.md`를 적용한다.

## Verification Harness와 완료

Reviewer는 `rules/verification.md`에 따라 typecheck, lint, production build를 각각
실행하고 요구사항·선택 Context 규칙을 함께 검토한다. 하나라도 실패하거나
BLOCKER/MAJOR가 있으면 FIX_REQUIRED다. 실행·확인하지 못한 runtime, UX, 접근성,
테스트 영역은 미검증으로 보고하며 PASS로 표현하지 않는다.

Git/commit/PR은 `rules/git.md`, 규칙 학습·승격은 `evolution/`을 따른다. 사용자가
명시하지 않으면 commit, push, PR을 수행하지 않는다.

## Usage Monitoring

`monitoring/`은 역할별 Token 사용량을 기록하는 관측 계층이며, 역할 권한·Lane·
Mutation Guard·Verification Gate·판정 기준을 바꾸지 않는다. 오케스트레이터는 각
Agent 호출이 끝날 때 로컬 스크립트로 사용량을 기록하고, Run 시작·종료에 boundary를
찍어 orchestrator 사용량을 세션 누적이 아닌 해당 Run delta로 기록한다. 집계에 별도 Agent를
쓰지 않고 transcript 내용을 Agent context에 넣지 않는다. 수집 실패는 Monitoring
Warning이며 FAIL이 아니다. 세부는 `monitoring/README.md`를 따른다.

수집은 `npm run harness:monitor`로 상시 실행하는 로컬 watcher가 담당하며, 결과는
gitignore된 `.harness/metrics/raw/`에 누적된다. 모든 기록에는 `.harness/VERSION`의
Harness Version과 Lane을 남겨 Version별·Lane별 비교가 가능하게 한다. Harness 구조를
바꾸는 변경에서는 같은 변경 안에서 `.harness/VERSION`을 올린다. Usage 수치는 사람이
읽는 근거일 뿐이며 Harness 규칙을 자동으로 바꾸지 않는다.

새로 추가하는 Harness 규칙 문서는 영어로 작성한다. 기존 문서를 번역하지 않으며, 기존
문서를 수정할 때는 그 문서의 언어를 그대로 따른다.

## Runtime Adapter parity

Claude와 Codex는 동일한 Root/Context/Role/Workflow/Rule 문서를 사용한다. 달라질 수
있는 것은 Agent를 생성·재개하는 네이티브 호출 방식뿐이며, 그 차이가 역할 권한·순서·
검증·판정을 바꾸면 안 된다.
