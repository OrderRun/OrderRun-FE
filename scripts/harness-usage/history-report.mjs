// Period report over the long-term history (`--days N` / `--history`).
// Read-only aggregation of local JSONL; no AI call, no network.

import { readHistory } from './lib/history.mjs'
import { avg, groupBy, mean, perRun, qualityByRun, rate, sinceISO } from './lib/aggregate.mjs'
import { fmt } from './store.mjs'

const pad = (t, w, left = false) => (left ? String(t).padStart(w) : String(t).padEnd(w))
const pct = (v) => (v === null ? '—' : `${(v * 100).toFixed(0)}%`)
const dec = (v) => (v === null ? '—' : v.toFixed(2))

function table(title, buckets, { detail }) {
  if (!buckets.size) return
  console.log(`\n${title}`)
  const header = detail
    ? pad('', 18) + ['runs', 'n', 'input', 'output', 'cacheRead', 'cacheWrite', 'reasoning', 'processed'].map((h) => pad(h, 12, true)).join('')
    : pad('', 18) + ['runs', 'n', 'avg output', 'avg cacheRead', 'avg processed'].map((h) => pad(h, 15, true)).join('')
  console.log(header)
  for (const [key, b] of [...buckets].sort((a, b) => b[1].processedTokens - a[1].processedTokens)) {
    const cells = detail
      ? [b.runs.size, b.records, avg(b, 'inputTokens'), avg(b, 'outputTokens'), avg(b, 'cacheReadTokens'), avg(b, 'cacheWriteTokens'), avg(b, 'reasoningTokens'), avg(b, 'processedTokens')].map(
          (v, i) => pad(i < 2 ? v : fmt(Math.round(v)), 12, true),
        )
      : [b.runs.size, b.records, avg(b, 'outputTokens'), avg(b, 'cacheReadTokens'), avg(b, 'processedTokens')].map((v, i) =>
          pad(i < 2 ? v : fmt(Math.round(v)), 15, true),
        )
    console.log(pad(String(key), 18) + cells.join(''))
  }
}

export async function historyReport(args) {
  const days = args.days ? Number(args.days) : null
  const since = days ? sinceISO(days) : null
  const { records, malformed } = await readHistory({ since })
  if (!records.length) {
    console.error(
      `[usage] no history records${days ? ` in the last ${days} day(s)` : ''}. ` +
        `Start the monitor with: npm run harness:monitor`,
    )
    process.exit(1)
  }
  if (malformed) console.log(`[usage] ${malformed} malformed history line(s) skipped`)

  console.log(`\nHarness Usage — ${days ? `last ${days} day(s)` : 'all history'}  ·  n = ${records.length} invocation(s)`)

  const detail = Boolean(args.detail)

  // Per provider, one row per Harness role, in the same columns the single-run
  // report uses. Share is a share of that provider's raw processed tokens.
  const providers = [...new Set(records.map((r) => r.provider))].sort()
  for (const provider of providers) {
    const selected = records.filter((r) => r.provider === provider)
    const total = selected.reduce((a, r) => a + Number(r.processedTokens ?? 0), 0)
    console.log(`\n${provider.toUpperCase()}`)
    console.log(
      pad('Role', 16) + ['n', 'Output', 'Cache Read', 'Processed Share'].map((h, i) => pad(h, i === 0 ? 6 : 16, true)).join(''),
    )
    for (const role of ['planner', 'implementer', 'reviewer', 'orchestrator', 'unknown']) {
      const rows = selected.filter((r) => r.role === role)
      if (!rows.length) continue
      const sum = (f) => rows.reduce((a, r) => a + Number(r[f] ?? 0), 0)
      console.log(
        pad(role, 16) +
          pad(rows.length, 6, true) +
          pad(fmt(sum('outputTokens')), 16, true) +
          pad(fmt(sum('cacheReadTokens')), 16, true) +
          pad(total ? `${((sum('processedTokens') / total) * 100).toFixed(1)}%` : '-', 16, true),
      )
    }
  }
  if (detail) table('BY PROVIDER (all fields)', groupBy(records, (r) => r.provider), { detail })
  table('BY LANE', groupBy(records, (r) => r.lane ?? 'unrecorded'), { detail })
  table('BY HARNESS VERSION', groupBy(records, (r) => r.harnessVersion ?? 'unrecorded'), { detail })

  // Per-run figures: the unit a Harness change is actually judged on.
  const runs = groupBy(records, (r) => r.runId ?? null)
  if (runs.size) {
    const all = [...runs.values()].reduce(
      (a, b) => {
        a.output += b.outputTokens
        a.cacheRead += b.cacheReadTokens
        a.processed += b.processedTokens
        return a
      },
      { output: 0, cacheRead: 0, processed: 0 },
    )
    console.log(`\nPER RUN (n = ${runs.size} run(s) with a recorded run id)`)
    console.log(`${pad('avg output', 22)}${pad(fmt(Math.round(all.output / runs.size)), 14, true)}`)
    console.log(`${pad('avg cache read', 22)}${pad(fmt(Math.round(all.cacheRead / runs.size)), 14, true)}`)
    console.log(`${pad('avg processed', 22)}${pad(fmt(Math.round(all.processed / runs.size)), 14, true)}`)
  }

  const quality = [...qualityByRun(records).values()]
  if (quality.length) {
    const first = rate(quality.map((q) => q.reviewerFirstPass))
    const rounds = mean(quality.map((q) => q.revisionRounds))
    const gates = rate(
      quality.flatMap((q) => [q.typecheckPassed, q.lintPassed, q.buildPassed, q.testPassed]),
    )
    console.log(`\nQUALITY (per run, from existing Harness artifacts — no agent was asked anything)`)
    console.log(`${pad('reviewer first pass', 24)}${pad(pct(first.rate), 10, true)}   n = ${first.n}`)
    console.log(`${pad('avg revision rounds', 24)}${pad(dec(rounds.mean), 10, true)}   n = ${rounds.n}`)
    console.log(`${pad('verification pass rate', 24)}${pad(pct(gates.rate), 10, true)}   n = ${gates.n}`)
  }

  console.log(
    `\nprocessedTokens = fresh input + output + cache read + cache write.\n` +
      `processedTokens != billing cost, != subscription usage, != charged tokens.\n` +
      `Provider columns are a raw token-processing comparison, not a price comparison.\n` +
      `Small n means a difference is not yet evidence.  --detail for every token field.\n`,
  )
}
