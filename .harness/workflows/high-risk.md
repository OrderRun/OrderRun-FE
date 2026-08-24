# Lane C — High-risk workflow

Use Lane C for authorization/permission, state transitions, data contracts,
architecture changes, multi-layer work, or broad refactoring; ambiguity chooses
this lane. Follow Lane B in full, additionally requiring the canonical Planner to list
affected dependency edges, contract evidence, rollback/compatibility concerns,
and each risk-specific observable criterion.

The canonical Reviewer performs enhanced verification after the ordinary gate: inspect all
affected layer boundaries in both directions, compare contract producers with
consumers, inspect authorization/state-transition evidence, and run an existing
targeted test when one exists. A missing test/runtime check remains unverified;
it cannot be implied by PASS. No independent verifier may edit source.

## Usage monitoring

Record usage as in Lane B. If the enhanced verification runs as a separate agent
spawn, record it as an additional `reviewer` round so the extra cost of Lane C
stays visible. See [`../monitoring/README.md`](../monitoring/README.md); a
collector failure is a monitoring warning only.

The run boundary (`harness:usage:start` before the first spawn,
`harness:usage:end` after PASS) brackets the whole run, so orchestrator usage is
this run's delta and not the whole Claude session.
