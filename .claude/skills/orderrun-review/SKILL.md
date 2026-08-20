---
name: orderrun-review
description: OrderRun-FE 변경의 공통 Harness 독립 리뷰·검증 게이트를 실행한다. 완료 판정이나 재검증에 사용한다.
---

# Claude Review Adapter

Read Root `AGENTS.md`, `.harness/roles/reviewer.md`, and only the Context/workflow
it selects. Run `.claude/agents/reviewer.md`, apply the shared mutation guard,
and use the shared PASS/FIX_REQUIRED result.
