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

PR descriptions contain only purpose, key changes, verification results, and
review focus. Create a PR only after the shared readiness gate passes; disclose
unverified areas rather than presenting them as tested.
