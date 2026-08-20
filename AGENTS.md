# OrderRun-FE Root Harness

이 파일은 Claude Code와 Codex가 함께 사용하는 프로젝트 루트 규칙이다.
`CLAUDE.md`, `.claude/`, `.codex/`는 실행 Adapter이며 여기의 역할·Lane·판정
기준을 변경하거나 복사해 별도 규칙으로 만들 수 없다.

## 프로젝트 지도

꼬붕단 관리자 웹. React 19 + TypeScript 6 + Vite 8을 사용한다. ESLint는
`--max-warnings 0`이며 테스트 러너, 라우터, 서버 상태관리, API/UI 라이브러리는
아직 도입되지 않았다. 설정이 바뀌었다는 근거가 있거나 새 의존성이 필요할 때만
원본 설정을 다시 조사한다.

| 관심사 | 선택 Context Harness |
|---|---|
| Page, Component, CSS, 사용자 입력, 화면 상태 | `.harness/context/presentation/AGENTS.md` |
| 비즈니스 규칙, 검증, 상태 전이, 순수 계산 | `.harness/context/domain/AGENTS.md` |
| API, DTO, mapper, 외부 데이터·오류 | `.harness/context/data/AGENTS.md` |
| API 결과를 UI에 연결 | Data + Presentation |
| 여러 레이어에 영향 | 영향받는 모든 Context, Lane C |

모든 작업은 이 Root Harness를 읽고 Planner가 필요한 Context만 선택한다. 관련 없는
Context 문서는 읽지 않는다. 선택 결과는 plan에 기록해 후속 역할이 재탐색하지 않게
한다.

## Architecture와 Dependency Rule

| Layer | 책임 |
|---|---|
| Presentation | React UI, interaction, routing, 화면 상태와 피드백 |
| Domain | 플랫폼 독립 비즈니스 모델·판단·검증·상태 전이 |
| Data | API client, request/response DTO, mapper, API 오류 처리 |

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

- `.harness/roles/planner.md`
- `.harness/roles/implementer.md`
- `.harness/roles/reviewer.md`

| Lane | 기준 | 흐름 |
|---|---|---|
| A — Lightweight | 단일 기존 파일의 명확한 문구/CSS/아이콘/소규모 수정. 새 파일·계약·타입·의존성 없음 | Implementer → Reviewer |
| B — Standard | 화면, Component, API 연동, 새 타입 등 일반 기능 또는 애매한 변경 | Planner → Implementer → Reviewer |
| C — High Risk | 인증·권한·상태 전이·계약·Architecture·다중 Layer·대규모 refactor | Planner → Implementer → Reviewer → 강화 검증 |

불확실하면 높은 Lane을 선택한다. 실행 세부는 `.harness/workflows/`의 해당 문서만
읽는다. FIX_REQUIRED이면 같은 Implementer가 지적만 수정하고 Reviewer가 재검증한다.

## Verification Harness와 완료

Reviewer는 `.harness/rules/verification.md`에 따라 typecheck, lint, production build를
각각 실행하고 요구사항·선택 Context 규칙을 함께 검토한다. 하나라도 실패하거나
BLOCKER/MAJOR가 있으면 FIX_REQUIRED다. 실행·확인하지 못한 runtime, UX, 접근성,
테스트 영역은 미검증으로 보고하며 PASS로 표현하지 않는다.

Git/commit/PR은 `.harness/rules/git.md`, 규칙 학습·승격은 `.harness/evolution/`을
따른다. 사용자가 명시하지 않으면 commit, push, PR을 수행하지 않는다.

## Runtime Adapter parity

Claude와 Codex는 동일한 Root/Context/Role/Workflow/Verification 문서를 사용한다.
달라질 수 있는 것은 Agent를 생성·재개하는 네이티브 호출 방식뿐이며, 그 차이가
역할 권한·순서·검증·판정을 바꾸면 안 된다.
