# Git, commit, and PR rules

## Commit messages

Use Conventional Commits with exactly this format:

```text
<type>: <summary>
```

Use only these lowercase English types:

| Type | Meaning |
|---|---|
| `feat` | New functionality |
| `fix` | Bug fix |
| `refactor` | Structural improvement without behavior change |
| `chore` | Configuration, dependency, Harness, or development-environment work |
| `docs` | Documentation change |
| `test` | Test change |
| `style` | Formatting or other code-style change without behavior impact |

The summary must be one concise line and should communicate the purpose rather
than merely listing the activity. Write it in Korean by default. Do not use a
vague summary that only says or ends in `수정` or `변경` without a concrete
purpose, and do not end it with a period.

Split different purposes into separate commits when practical. Do not include
unrelated changes in a commit.

## Authorization and PRs

Do not commit, push, or create a PR unless the user explicitly asks.

PR descriptions contain only purpose, changed contents, verification results,
unverified areas, and review focus. Create a PR only after the shared readiness
gate passes; disclose unverified areas rather than presenting them as tested.

### Promotion PR from dev to main

Treat promotion PR creation and merge as separate permissions. When the user
explicitly requests a promotion PR, create only a PR whose head is `dev` and base
is `main`.

Before creating it:

- confirm that the remote `dev` and `main` branches exist and that the inspected
  `main...dev` diff is not empty;
- check for an existing open `dev` to `main` PR and report it instead of creating
  a duplicate;
- run every required gate from the shared readiness rule independently;
- stop without creating the PR if a required gate fails, and report concise
  failure evidence; and
- stop and report the blocker if creating the PR would require an additional
  push that the user did not separately request.

The PR body must contain all of the following sections:

1. purpose;
2. changed contents derived from the inspected `main...dev` diff at creation
   time, summarizing meaningful changed areas or files without pasting the full
   diff;
3. verification commands and results;
4. unverified areas; and
5. review focus.

PR creation permission does not authorize merging, enabling auto-merge, pushing
additional changes, creating a tag or release, or triggering a deployment.
Because merging into `main` may deploy, merge only after the PR exists and the
user gives a separate explicit merge request.

After creating the PR, report its link, head and base branches, verification
results, and unverified areas. Do not claim that PR creation deployed or merged
the change.
