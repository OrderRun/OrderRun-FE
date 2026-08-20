# Lane A — Lightweight workflow

Use only when the Root `AGENTS.md` definition of Lane A is fully met. The orchestrator
passes the one-line request and target file directly to the canonical
[`Implementer`](../roles/implementer.md); no plan is written.

Then run the canonical [`Reviewer`](../roles/reviewer.md) as an independent
verifier with the same narrowed scope.
Capture source-status immediately before and after that reviewer call. The
reviewer writes `review_r{N}.md`, runs the shared gate, and returns PASS or
FIX_REQUIRED. Fixes go to the retained implementer; a request that expands scope
is promoted to Lane B or C.
