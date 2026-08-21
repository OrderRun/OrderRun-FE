---
name: orderrun-review
description: OrderRun-FE 변경의 공통 Harness 독립 리뷰·검증 게이트를 실행한다. 완료 판정이나 재검증에 사용한다.
---

# Codex Review Adapter

Enter through root `AGENTS.md`, read `.harness/root.md`, `.harness/roles/reviewer.md`,
and only the Context/workflow selected from the review scope. Spawn Reviewer with
that canonical definition, apply `.harness/rules/mutation-guard.md`, and use the
shared PASS/FIX_REQUIRED result.
