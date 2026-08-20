---
name: orderrun-development
description: OrderRun-FE 기능·버그·리팩터링을 공통 Harness의 Planner → Implementer → Reviewer 루프로 수행한다. 단순 읽기·질문에는 사용하지 않는다.
---

# Claude Development Adapter

Read Root `AGENTS.md`; select one shared Lane and only the matching Context
`AGENTS.md` and workflow. Run canonical `.harness/roles/` through matching
`.claude/agents/` adapters. Reuse the same Implementer for fix rounds and apply
the shared mutation guard around Planner/Reviewer. Claude-specific agent
invocation is the only behavior defined here.
