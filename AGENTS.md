# OrderRun-FE — Codex 프로젝트 지도

꼬붕단 관리자 웹: React + TypeScript + Vite. 운영자가 Request, Application,
Mission, Dispute 상태를 관리·추적하는 어드민이다.

## 빠른 지도

| 위치 | 책임 |
|---|---|
| `src/main.tsx` | 앱 엔트리 |
| `src/App.tsx` | 루트 UI |
| `src/index.css` | 전역 스타일 |
| `docs/project-conventions.md` | 확인된 스택·컴파일러·배치 규칙 |
| `docs/codex-harness.md` | 역할, 레인, 인계·검증 절차 |
| `.codex/skills/orderrun-development/` | 기능 변경 오케스트레이션 Skill |
| `.codex/skills/orderrun-review/` | 독립 리뷰·검증 Skill |
| `.claude/` / `CLAUDE.md` | Claude Code Harness — 수정하지 않음 |

## Codex Harness

기능 구현·수정·버그 수정·리팩터링에는 `orderrun-development` Skill을 사용한다.
코드 읽기, 질문, 문서 작업만이면 이 워크플로우를 시작하지 않는다. 변경 후
독립 판정만 필요하면 `orderrun-review` Skill을 사용한다.

워크플로우는 다음 순서를 지킨다.

```text
planner → feature-implementer → reviewer
                         ↑          │
                         └─ FIX_REQUIRED (최대 3 라운드)
```

- **implementer만** `src/` 및 앱/설정 파일을 수정할 수 있다. planner와 reviewer는
  `_workspace/{slug}/`의 자기 리포트만 작성한다.
- planner/reviewer 호출 전후에 지정 경로의 `git status --porcelain` 스냅샷을 비교한다.
  두 역할이 소스를 바꾸면 그 라운드 판정은 무효다.
- API 엔드포인트·응답 스키마·필드·상태값·권한·경로를 추측하지 않는다. 근거가 없고
  구현 방향에 영향을 주면 사용자 확인 전 중단한다.
- `typecheck`, `lint`, `build`가 모두 exit 0이고 reviewer가 PASS해야만 완료다.
  실행하지 못했거나 읽지 못한 영역은 PASS가 아니라 미검증으로 보고한다.
- 단일 기존 파일의 문구·상수·스타일·간단한 버그 수정은 경량 레인(implementer →
  reviewer)을 쓴다. 새 파일/타입/데이터 흐름/화면 또는 애매한 변경은 표준 레인
  (planner → implementer → reviewer)을 쓴다.
- 검색 결과, 계획의 관련 파일, 변경 파일만 읽는다. 전체 코드베이스를 매번 탐색하지
  않는다. 인계 문서는 결정·변경·실패만 기록하고 중복하지 않는다.

## 프로젝트 규칙

`docs/project-conventions.md`는 확인된 사실의 단일 기록이다. 새 의존성이 필요하거나
문서가 낡았다고 의심될 때만 원본 설정을 재확인한다. 상세 역할·리포트 형식·수정
루프는 `docs/codex-harness.md`를 따른다.

## 검증 명령

```sh
npm run typecheck
npm run lint
npm run build
```

세 명령은 독립 실행하고 각각의 exit code로 판정한다. `&&`나 `| tee`로 묶지 않는다.
검증 로그 전문은 인계 문서에 넣지 말고 실패 줄만 기록한다.
