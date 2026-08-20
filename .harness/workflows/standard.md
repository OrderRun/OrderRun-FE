# Lane B — Standard workflow

## Roles

Run the canonical roles in order:

1. [`Planner`](../roles/planner.md)
2. [`Implementer`](../roles/implementer.md)
3. [`Reviewer`](../roles/reviewer.md)

Their definitions own permissions, inputs, outputs, and handoffs; this workflow
owns only sequencing and retries. Planner blockers pause for user confirmation.

Before each planner or reviewer call, capture and afterwards compare:

```sh
git status --porcelain -- src package.json tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js index.html
```

Any change by either role invalidates that stage. On FIX_REQUIRED, resume the
same implementer and change only findings; then rerun reviewer. Escalate after
three unresolved rounds, a planning defect, or an environment/config failure.
