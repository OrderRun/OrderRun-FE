---
name: orderrun-review
description: OrderRun-FE 변경의 독립 리뷰와 typecheck·lint·build 게이트를 수행해 PASS 또는 FIX_REQUIRED를 판정한다. 구현 완료 여부나 재검증 요청에 사용한다.
---

# OrderRun-FE Review Gate

시작 전 루트 `AGENTS.md`, [실행 규약](../../../docs/codex-harness.md)의 “독립 리뷰와
완료”, [프로젝트 규칙](../../../docs/project-conventions.md)을 읽는다.

리뷰어 역할은 코드를 수정하지 않는다. 호출 전후 소스 무변경 가드를 비교하고,
`_workspace/{slug}/review_r{N}.md`만 작성한다. 현재 scripts를 확인한 뒤 다음 명령을
독립 실행해 각 exit code를 기록한다.

```sh
npm run typecheck
npm run lint
npm run build
```

계획(또는 경량 입력), `impl.md`, 변경된 파일만 읽어 계획 완료 기준·경계 상태·데이터,
상태, props 경계를 검토한다. 실행하지 않은 검증이나 읽지 못한 영역은 미검증이다.
PASS는 세 exit code가 0이고 BLOCKER와 MAJOR가 모두 0일 때만 가능하다. 그렇지 않으면
위치, 근거, 실패 시나리오, 수정 지시가 있는 FIX_REQUIRED를 작성한다.
