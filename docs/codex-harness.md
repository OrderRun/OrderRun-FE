# Codex Harness 실행 규약

## 역할과 산출물

| 역할 | 허용 쓰기 | 산출물 | 한도 |
|---|---|---|---|
| planner | `_workspace/{slug}/plan.md` | 조사·계획 | 80줄 |
| feature-implementer | `src/`, 필요한 프로젝트 파일, `_workspace/{slug}/impl.md` | 구현·수정 | 30줄 |
| reviewer | `_workspace/{slug}/review_r{N}.md` | 검증·판정 | 40줄 |

`_workspace/`는 git-ignore된 작업 산출물이며 삭제하지 않는다. planner/reviewer는
소스, 설정, 의존성을 절대 수정하지 않는다. 오케스트레이터는 두 역할의 호출 직전과
직후 아래 대상의 상태를 비교한다.

```sh
git status --porcelain -- src package.json tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js index.html
```

차이가 나면 해당 판정은 무효이며 사용자에게 보고한다.

## 레인 선택

| 레인 | 조건 | 흐름 |
|---|---|---|
| 경량 | 단일 기존 파일, 새 파일/의존성/데이터 계약·타입 변경 없음 | implementer → reviewer |
| 표준 | 그 외 또는 애매함 | planner → implementer → reviewer |

경량 레인은 요구사항 한 줄과 대상 파일을 `plan.md` 대신 전달한다. 표준 레인의
planner는 용어 검색 결과 파일만 읽고 아래 계획을 만든다.

```markdown
# Plan: {기능명}
## 목표 / 비목표
## 완료 판정 기준
## 관련 파일 (경로 / 이유)
## 전제 / 확인 필요 (항목 / 근거 / 틀렸을 때 영향)
## 파일 계획 (경로 / 신규·수정 / 단일 책임 / 필요한 이유)
## 타입 계약
## UI / 데이터 분리
## 경계 상태 (로딩 / 실패 / 빈 데이터 / 잘못된 입력·권한 없음)
## 검증 기준
```

API 스키마, 상태값, 권한, 경로 등 구현 방향을 바꾸는 확인 필요 항목이나 새 의존성이
있으면 planner 다음에서 멈추고 사용자 확인을 받는다.

## 구현과 수정

implementer는 계획의 관련 파일·수정 대상만 읽고 계획 파일만 만든다. 계획 밖 파일이
필요하면 만들지 말고 계획 변경을 요청한다. 정상 경로뿐 아니라 경계 상태 표를 행별로
구현한다. 자체 검증 후에도 완료를 선언하지 않는다.

`impl.md`에는 변경 파일, 계획과의 차이, 억제 사용과 사유, 세 검증 exit code,
확인 필요만 쓴다. 리뷰 수정은 기존 implementer에게 전달해 지적 항목만 바꾸며,
각 항목을 `수정함` / `반박함(근거)` / `계획 변경 필요` 중 하나로 기록한다.

## 독립 리뷰와 완료

reviewer는 먼저 현재 `package.json` scripts를 확인한 뒤 typecheck/lint/build를
각각 실행한다. 로그는 `_workspace/{slug}/.verify.log`로 보내고 exit code를 판정
근거로 쓴다. 실패 시 에러 줄만 확인한다.

그 다음 `plan.md`(경량 레인은 요구사항), `impl.md`, 변경된 `src` 파일만 읽고 계획
완료 기준·경계 상태·데이터/상태/props 경계를 양쪽에서 비교한다. 추측 데이터,
요구 누락, 계획 위반은 BLOCKER; 경계 상태 누락·UI/데이터 혼재·중복·근거 없는 억제는
MAJOR; 명명·배치는 MINOR다.

PASS 조건은 **세 검증 exit 0 + BLOCKER 0 + MAJOR 0**이다. 리뷰하지 못한 파일,
실행하지 못한 검증, 런타임 동작과 미도입 테스트는 `미검증`으로 명시한다.

FIX_REQUIRED이면 reviewer의 전체 지시를 기존 implementer에 전달하고 재검증한다.
최대 3라운드이며, 반복 실패·환경/설정 실패·검증 불가는 완료가 아니라 에스컬레이션이다.

`review_r{N}.md`에는 검증 표, PASS/FIX_REQUIRED와 등급 수, 위치·근거·실패 시나리오·
수정 지시, 미검증만 기록한다. 라운드 파일은 덮어쓰지 않는다.
