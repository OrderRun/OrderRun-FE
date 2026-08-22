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

## Usage monitoring

The orchestrator records usage for the implementer and the verifying reviewer,
and for each fix round, per [`../monitoring/README.md`](../monitoring/README.md).
Lane A records no planner, which is what makes its token cost comparable against
Lane B. A collector failure is a monitoring warning only.

The run boundary (`harness:usage:start` before the first spawn,
`harness:usage:end` after PASS) brackets the whole run, so orchestrator usage is
this run's delta and not the whole Claude session.
