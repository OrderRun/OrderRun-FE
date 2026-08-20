---
name: orderrun-development
description: OrderRun-FE의 기능·버그·리팩터링을 planner → implementer → 독립 reviewer 검증 루프로 수행한다. 단순 코드 읽기나 질문에는 사용하지 않는다.
---

# OrderRun-FE Development

이 Skill은 검증되지 않은 변경을 완료로 선언하지 않도록 역할을 분리한다. 시작 전
루트 `AGENTS.md`, 이어서 [실행 규약](../../../docs/codex-harness.md)과
[프로젝트 규칙](../../../docs/project-conventions.md)을 읽는다.

## 실행

1. 요청을 경량 또는 표준 레인으로 분류한다. 애매하면 표준이다.
2. 표준 레인에서는 planner를 먼저 별도 에이전트로 실행한다. planner는 리포트만
   작성하며, 불확정 API/상태/권한/경로 또는 새 의존성이 나오면 사용자 확인 전 멈춘다.
3. implementer를 별도 에이전트로 실행한다. 이 역할만 앱 소스를 수정한다. 계획 또는
   경량 입력의 대상 파일만 읽고 구현·자체 검증·`impl.md`를 작성하게 한다.
4. reviewer를 별도 에이전트로 실행해 검증과 계획 대비 리뷰를 하나의 판정으로 받는다.
   호출 전후 소스 무변경 가드를 비교한다.
5. FIX_REQUIRED이면 **같은 implementer**에게 리뷰 문서를 전달해 지적 항목만 수정하게
   하고 reviewer를 다시 실행한다. 최대 3 라운드까지다.

planner와 reviewer에게는 `src/`·설정 파일을 수정하지 말고 정해진 `_workspace/`
리포트만 작성하라고 명시한다. reviewer PASS와 세 검증 exit 0이 모두 없으면 완료라고
말하지 않는다. 최종 보고에는 변경 파일, exit code, 남은 MINOR, 미검증, 미확정 전제를
짧게 포함한다.
