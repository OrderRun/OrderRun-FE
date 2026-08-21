---
name: orderrun-development
description: OrderRun-FE 기능·버그·리팩터링을 공통 Harness의 Planner → Implementer → Reviewer 루프로 수행한다. 단순 읽기·질문에는 사용하지 않는다.
---

# Claude Development Adapter

Enter through `CLAUDE.md`, read canonical `.harness/root.md`; select one shared
Lane and only the matching Context `AGENTS.md` and workflow. Run canonical `.harness/roles/` through matching
`.claude/agents/` adapters. Apply `.harness/rules/mutation-guard.md` around
Planner/Reviewer. Claude-specific agent invocation is the only behavior defined
here.

Right after spawning the Implementer, record its identifier with `ListAgents`.
On FIX_REQUIRED, resume that same identifier with `SendMessage` and pass only the
findings; never spawn a new Implementer, which loses the round context and causes
a full rewrite.
