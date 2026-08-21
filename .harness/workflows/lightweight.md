# Lane A — Lightweight workflow

Use only when the shared Root [`../root.md`](../root.md) definition of Lane A is fully met.
Without spawning a Planner, the orchestrator selects the Context from the exact request and
target file, then passes that selection with the one-line request directly to the canonical
[`Implementer`](../roles/implementer.md); no plan is written.

Then run the canonical [`Reviewer`](../roles/reviewer.md) as an independent
verifier with the same narrowed scope.
Apply [`mutation-guard.md`](../rules/mutation-guard.md) immediately before and after that
reviewer call. The
reviewer writes `review_r{N}.md`, runs the shared gate, and returns PASS or
FIX_REQUIRED. Fixes go to the retained implementer; a request that expands scope
is promoted to Lane B or C.
