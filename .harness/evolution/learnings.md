# Harness learning candidates

Record a candidate before promoting a new permanent rule. Do not add one for a
one-off issue. Use this compact template:

```markdown
## {date} — {short problem}
- Area/role:
- Cause and recurrence risk:
- Impact:
- Candidate rule and narrow target:
- Decision: pending | promoted | rejected
```

## Promotion criteria

Promote a candidate to a permanent rule only when at least one holds:

- the same mistake occurred more than once;
- it can cause a runtime failure, data corruption, or a security/permission defect;
- it risks an Architecture or Dependency Rule violation;
- it is a project-wide decision that is now confirmed.

A one-off issue stays a candidate and is closed as `rejected`. An existing rule
that was simply not followed is not a new rule; fix the process, not the text.

## Scope placement

Add the rule to the narrowest document that owns it, and to exactly one document.

| Rule kind | Target |
|---|---|
| UI, component, screen state | `context/presentation/AGENTS.md` |
| Business model, validation, state transition | `context/domain/AGENTS.md` |
| API, DTO, mapper, API error | `context/data/AGENTS.md` |
| Gate command, severity, completion | `rules/verification.md` |
| Commit, PR | `rules/git.md` |
| Role permission, input, output | `roles/*.md` |
| Lane sequencing, retries | `workflows/*.md` |
| Project-wide fact or invariant | `.harness/root.md` |

Do not create a duplicate rule. If a related rule exists, edit that rule in place
instead of adding a second one. Never copy a promoted rule into `CLAUDE.md`,
`.claude/`, `.codex/`, or `README.md`; those are adapters and documentation.

## Promotion authority

Planner, Implementer, and Reviewer never modify Harness documents. Promotion is a
separate step outside the lane, performed only with explicit user approval, and
recorded in `changelog.md` with date, change, updated shared source, and reason.

## 2026-08-21 — Ambiguous commit messages

- Area/role: Git and commit handoff
- Cause and recurrence risk: A short open-ended convention lets humans and AI choose inconsistent types, language, and vague summaries across every change.
- Impact: Commit history loses purpose and becomes harder to scan or automate against.
- Candidate rule and narrow target: Define one closed Conventional Commit format and summary policy in `rules/git.md`.
- Decision: promoted — the user explicitly confirmed this project-wide convention.
