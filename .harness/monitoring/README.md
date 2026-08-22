# Agent Token Usage Monitor

An observability layer on top of the existing Harness. It records how many
tokens each role actually spent in a run, so Harness optimization decisions are
made from data instead of from feel.

It adds nothing to the Harness contract. Roles, Lanes, the Mutation Guard, the
Verification Gate and the Evolution rules are unchanged — see
[`../root.md`](../root.md). This layer only observes.

- Shared record contract: [`usage-schema.md`](usage-schema.md)
- Collector + reporter: `scripts/harness-usage/`
- Stored data: `_workspace/{slug}/usage.json` (gitignored, never committed)

## Hard rules

1. **No AI agent measures usage.** Collection is a local script parsing a
   transcript's usage fields. Spawning an analyzer agent is prohibited: the
   measurement would consume the thing it measures.
2. **No transcript content enters any agent context.** The collector reads line
   by line and writes numbers plus minimal metadata. Never paste a transcript,
   or a summary of one, into a prompt.
3. **Collector failure is a warning, not a FAIL.** typecheck / lint / build
   failures fail the feature; a collector problem prints `[usage] warning: …`,
   exits 0, and the workflow continues. Add `--strict` only when debugging the
   collector itself.
4. **No budgets yet.** This step measures only. Automatic thresholds or forced
   stops are deliberately absent until real numbers justify a number.
5. **No pricing.** `processedTokens` is a raw throughput counter, not cost or
   plan usage. Cache tokens stay separate and provider raw values are not a
   price comparison.

## Run boundary (orchestrator)

The main session transcript is append-only and outlives one Harness run, so
scanning it whole gives a *session-cumulative* number that is not comparable
with the per-invocation numbers of the other roles. Orchestrator usage is
therefore a delta between two snapshots:

```
npm run harness:usage:start -- --run <slug>   # before the first agent spawn
...planner / implementer / reviewer, plus any fix rounds...
npm run harness:usage:end   -- --run <slug>   # after PASS
```

`start` stores a cumulative snapshot as `runBoundary.baseline` inside
`_workspace/{slug}/usage.json`. `end` takes a second snapshot and records
`orchestrator-r1` as `end - baseline`, tagged `measurementMode: "run_delta"`.
Tokens spent before the run began are never attributed to it, so a long-lived
Claude session measures each run correctly.

A snapshot delta is used rather than a timestamp filter: a boundary cannot land
mid-response, and the same `message.id` normalization used for agent
invocations applies, so a response written across several transcript lines is
counted once.

Rules:

- `start` on a run with an open baseline keeps the existing baseline
  (`--force` resets it), so restarting never discards tokens already spent.
- `end` is idempotent: it replaces the single orchestrator record and
  recomputes from the unchanged baseline. It never accumulates.
- Fix rounds stay inside one run boundary: the orchestrator is one delta per
  run, while planner / implementer / reviewer stay per round.
- A negative delta means the transcript changed under the baseline. No record
  is written and a monitoring warning is stored instead of a fabricated number.
- Missing baseline, failed end snapshot, negative delta and transcript access
  failures are all monitoring warnings recorded on the run document. They exit
  0 and never fail the feature.
- Records written before this mode existed carry no `measurementMode` and are
  treated as `session_cumulative`. They are excluded from the comparison table
  rather than recomputed — a cumulative figure carries no information about
  where its run began.

## Collecting

Run once per agent invocation, right after that agent returns:

```
npm run harness:usage:collect -- --run <slug> --role <role> --round <n> [--agent-id <id>]
```

- `--run` — the same slug as `_workspace/{slug}/`.
- `--role` — `planner` | `implementer` | `reviewer`. The orchestrator is not
  collected here; it uses the run boundary above.
- `--round` — 1 for the first pass, 2+ for FIX_REQUIRED rounds.
- `--agent-id` — the provider's agent id, when the spawn result exposes one.
  **Pass it whenever it is available**: it is the only exact match. Without it
  the collector stays inside the current session, matches on the agent's logical
  role, and takes the most recent transcript not already charged to another
  invocation — safe, but ambiguous if several same-role agents ran concurrently.
- `--session` — override the session id (defaults to `$CLAUDE_SESSION_ID`, then
  the newest session for this project directory).
- `--provider codex --transcript <file>` — collect exactly one Codex invocation
  JSONL. The orchestrator explicitly supplies role and round; the adapter never
  infers either from transcript content and never recursively searches sessions.

Prefer preserving Codex exec output when invoking each role:

```
mkdir -p _workspace/<slug>/runtime
codex exec --json <role-prompt> > _workspace/<slug>/runtime/codex-<role>-r<n>.jsonl
npm run harness:usage:collect -- --provider codex --run <slug> --role <role> \
  --round <n> --transcript _workspace/<slug>/runtime/codex-<role>-r<n>.jsonl
```

Run collection after `codex exec` finishes. A shell wrapper should preserve the
Codex exit status independently; collector warnings always remain non-fatal.

Re-running the same `--role`/`--round` overwrites that one record in place, so
collection is idempotent. A transcript already charged to a different
invocation is refused rather than double-counted.

## Reading

```
npm run harness:usage                 # most recently updated run
npm run harness:usage -- --run <slug>
npm run harness:usage -- --run <slug> --detail   # input/output/cache breakdown
npm run harness:usage -- --run <slug> --json     # raw record
```

Role subtotals, fix-round lines, share percentages and the grand total are
computed by the reporter at print time. Only the per-invocation records are
stored, so a derived number can never go stale.

## Where it hooks into the workflow

Collection points per Lane, in `workflows/`:

| Lane | collected invocations |
|---|---|
| A — Lightweight | `implementer-r1`, `reviewer-r1` (verification gate), plus any fix rounds |
| B — Standard | `planner-r1`, `implementer-r1`, `reviewer-r1`, plus fix rounds |
| C — High Risk | as Lane B, plus any reinforced-verification invocation that is a separate agent spawn |

The orchestrator is bracketed by `harness:usage:start` / `harness:usage:end`
around the whole run. Its snapshots exclude sidechain events, so subagent usage
already recorded per invocation is not counted twice.

On PASS, print the run summary with `npm run harness:usage`.

## Extending to another provider

Add one adapter under `scripts/harness-usage/providers/` exporting
`collect({ runSlug, role, round, sourceId, sessionId, cwd, usedSourceIds })`
and returning a record in the shared schema, then register it in
`collect.mjs`. Schema, storage and reporter stay untouched.

A provider is implemented only after its real usage source has been inspected in
this environment. Field names are never written from memory or assumption.

**Claude** — implemented, verified against real transcripts in this environment.
**Codex** — implemented. Primary source is the explicit `codex exec --json`
invocation file at `turn.completed.usage`. The verified local-rollout fallback
is `event_msg` → `payload.type == token_count` → `info.last_token_usage`.
`info.total_token_usage` is cumulative and is never summed. If both source
types occur in one file, `turn.completed` wins for the whole invocation.

## Relation to the Evolution Harness

This layer produces observation data only. It never edits a Harness rule, and
high usage for a role is never by itself grounds to change that role. A human
reads the numbers and decides — for example whether Lane A genuinely saves
tokens, whether the reviewer costs more than the implementer, or how expensive
fix rounds really are. Any resulting rule change goes through `evolution/`.

## Automatic monitor (no manual start/end per invocation)

```
npm run harness:monitor              # start once, leave running while you work
npm run harness:monitor -- --once    # single incremental pass (used by tests)
```

The monitor is a local Node script with zero dependencies. **It makes 0 AI
calls**: it never spawns an agent, never asks a role anything, and never puts
transcript content into any context. It reads usage numbers line by line and
appends them to a local file.

Sources, in descending attribution quality:

| # | source | role comes from | attribution |
|---|---|---|---|
| 1 | `_workspace/{slug}/usage.json` | the orchestrator's own `--role`/`--round` | `harness` |
| 2 | Claude subagent transcripts for this project dir | sibling `agent-*.meta.json` `agentType` | `auto` |
| 3 | Codex rollout JSONL whose `session_meta.cwd` is this project | not recorded by Codex, so `unknown` | `auto` |

Role is never inferred from transcript *content*. A Codex rollout the Harness
did not label is stored as `role: "unknown"` rather than forced into a role.

The monitor never rescans a Claude **main session** transcript, so orchestrator
usage stays the run-boundary delta produced by `harness:usage:start/end` and can
never regress to a session-cumulative figure.

Performance and safety:

- per-file cursor (size + mtime) in `monitor-state.json`; unchanged files are
  never opened,
- a file is ingested only after it has been quiet for `--quiet` ms (default
  15000), so a running agent is not recorded half-finished,
- `fs.watch` on a handful of directories plus a 30s safety poll — no busy loop,
  no recursive walk of `~/.claude` or `~/.codex`,
- line-by-line parsing; no transcript is ever loaded whole,
- every failure is a warning and exit 0. A dead monitor cannot fail a feature,
  and monitoring is wired to no verification gate.

## Long-term history

```
.harness/metrics/raw/usage-history.jsonl   # one JSON record per line, append-only
.harness/metrics/raw/monitor-state.json    # per-provider cursors
```

Both are gitignored (`.harness/metrics/`) and never committed. Appending never
rewrites the file, so cost stays constant as history grows. Duplicates are
handled on read: records sharing `provider + sourceId` collapse into one, and a
`harness`-attributed record supersedes an `auto` one. Restarting the monitor, or
losing the cursor file entirely, therefore adds nothing.

Never stored: prompts, agent responses, transcript bodies, source code, env
values, keys, emails. Only counters plus the metadata in `usage-schema.md`.
`sourceId` is kept in the *raw local* file for debugging and is stripped before
anything reaches the portfolio directory.

## Reading the history

```
npm run harness:usage                     # the latest single run (unchanged)
npm run harness:usage -- --detail         # per-field breakdown
npm run harness:usage -- --days 7         # period report over the history
npm run harness:usage -- --days 30 --detail
npm run harness:usage -- --history        # all history
```

The period report averages by provider, role, Lane and Harness version, plus
per-run output / cache read / processed and the quality roll-up (reviewer first
pass rate, average revision rounds, verification pass rate).

## Harness version

`.harness/VERSION` (semver, e.g. `1.0.0`) is the single source. Every record
stores the version in force when it was written, so a Harness change can be
evaluated by comparing versions. Bump it in the same change that alters the
Harness structure.

## Lane

Declared: `npm run harness:usage:start -- --run <slug> --lane B` (or `--lane` on
`harness:usage:collect`). Undeclared, the monitor falls back to the run's own
artifacts: `Lane X` in the `review_r1.md` header, else Lane A when the run has
reviews but no `plan.md`. A lane it cannot establish stays `null`, and the
record's `laneSource` says which of the three it was.

## Quality metadata

Read by script from artifacts the Harness already writes — no agent is asked
anything extra:

| field | source |
|---|---|
| `reviewerFirstPass` | `PASS` / `FIX_REQUIRED` in `review_r1.md` |
| `revisionRounds` | number of `review_r*.md` files, minus one |
| `typecheckPassed` / `lintPassed` / `buildPassed` / `testPassed` | the `Gates:` exit codes in the final review |

Anything a script cannot read with certainty stays `null`. A missing number is
always preferred over a guessed one.

## Portfolio snapshot

```
npm run harness:usage:snapshot
```

Aggregates the raw history into `docs/engineering/harness-metrics/`
(`history.csv`, `summary.json`) — the only usage data that is committed. Run
slugs, session ids, transcript paths and `sourceId` are dropped by aggregation,
and the writer refuses to emit a file that still contains one.

`summary.json` compares Harness versions, but a change percentage is computed
only when both versions have at least 3 runs; otherwise it is `null` with the
sample size stated. Provider figures are a raw token-processing comparison. No
pricing model is applied and no cost conclusion is drawn from them.

## Relation to Evolution, again

Usage data informs a human. It never edits a rule. "planner usage went up, so
drop the planner" is not a conclusion this layer is allowed to reach — the
numbers go into `evolution/` as evidence for a person to weigh.
