# Lane B — Standard workflow

## Roles

Run the canonical roles in order:

1. [`Planner`](../roles/planner.md)
2. [`Implementer`](../roles/implementer.md)
3. [`Reviewer`](../roles/reviewer.md)

Their definitions own permissions, inputs, outputs, and handoffs; this workflow
owns only sequencing and retries. Planner blockers pause for user confirmation.

Before and after each Planner or Reviewer call, apply the shared
[`mutation-guard.md`](../rules/mutation-guard.md). Any delta in the git-observable project
area invalidates the stage, including changes made on top of an already-dirty file.
On FIX_REQUIRED, resume the
same implementer and change only findings; then rerun reviewer. Escalate after
three unresolved rounds, a planning defect, or an environment/config failure.

## Usage monitoring

The orchestrator captures its usage baseline before the first spawn and closes
the run boundary after PASS, so its own usage is this run's delta rather than
the whole Claude session. After each role invocation returns, it records that
invocation's token usage per
[`../monitoring/README.md`](../monitoring/README.md): `planner-r1`,
`implementer-r1`, `reviewer-r1`, and one further record per fix round
(`implementer-r2`, `reviewer-r2`, …). Collection is a local script, never an
agent. A collector failure is a monitoring warning and does not invalidate the
stage or the gate. On PASS, print the run summary.
