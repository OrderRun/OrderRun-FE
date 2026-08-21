---
name: orderrun-development
description: OrderRun-FE 기능·버그·리팩터링을 공통 Harness의 Planner → Implementer → Reviewer 루프로 수행한다. 단순 읽기·질문에는 사용하지 않는다.
---

# Codex Development Adapter

Enter through root `AGENTS.md`, read canonical `.harness/root.md`, select the Lane,
then load only its matching Context `AGENTS.md` and workflow. The shared Harness
is the source of all decisions.

Use available Codex collaboration tools to spawn separate agents whose prompts
require the matching canonical files in `.harness/roles/`: Planner,
Implementer, and Reviewer. Keep the Implementer agent alive and use a follow-up
task for review fixes. Apply `.harness/rules/mutation-guard.md` before and after
each Planner/Reviewer call. Codex-specific tool invocation is the only behavior
defined here.
