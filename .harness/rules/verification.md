# Verification and readiness gate

Before review, the implementer runs each available gate independently. The
reviewer first checks the current scripts, then reruns the applicable gates:

| Gate | Current command | Required |
|---|---|---|
| Type | `npm run typecheck` | yes |
| Lint | `npm run lint` | yes; warnings fail |
| Production build | `npm run build` | yes |
| Tests | `npm run test` | required once a script exists |

Capture each exit code without `&&` or `| tee`; logs stay out of handoffs. On
failure, pass only the key error lines, file, and minimum context. Do not weaken
configuration to make a gate pass.

The reviewer compares plan criteria, each boundary state, changed files, and
the relevant layer rules. Classify requirement/contract/architecture violations
as BLOCKER; missing boundary states, mixed responsibilities, duplication, or
unexplained suppression as MAJOR; naming/readability as MINOR.

PASS requires every required gate exit 0 and no BLOCKER or MAJOR. Static checks
do not prove runtime, UX, accessibility, or unexecuted tests; list these as
unverified. A nonzero gate, an incomplete review, or an unverified required
criterion is FIX_REQUIRED, never completion.
