#!/usr/bin/env node
// Portfolio snapshot - aggregate the local raw history into committable files.
//
//   npm run harness:usage:snapshot
//
// Reads .harness/metrics/raw/usage-history.jsonl (gitignored) and writes
// docs/engineering/harness-metrics/. Only aggregates leave this script: no
// sourceId, session id, transcript path, run slug, prompt, model output or any
// other runtime identifier is written. No AI call is involved.

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readHistory } from './lib/history.mjs'
import { avg, groupBy, mean, qualityByRun, rate, sinceISO } from './lib/aggregate.mjs'
import { parseArgs, warn } from './store.mjs'

const OUT_DIR = path.join('docs', 'engineering', 'harness-metrics')
// Fields that must never reach a committed file.
const FORBIDDEN = ['sourceId', 'runId', 'transcriptPath', 'sessionId']

const round = (v) => (v === null || v === undefined ? '' : Math.round(v))
const num3 = (v) => (v === null || v === undefined ? '' : Number(v.toFixed(3)))

function csvRows(records) {
  // One row per (date, harnessVersion, provider, lane, role). runCount counts
  // distinct runs behind the row; sampleSize counts invocations.
  const groups = groupBy(records, (r) =>
    [String(r.timestamp).slice(0, 10), r.harnessVersion ?? '', r.provider, r.lane ?? '', r.role].join(' '),
  )
  const qualityRuns = qualityByRun(records)

  const rows = []
  for (const [key, bucket] of [...groups].sort()) {
    const [date, harnessVersion, provider, lane, role] = key.split(' ')
    // Quality is a per-run property, scoped here to the runs behind this row.
    const scoped = [...qualityRuns.entries()]
      .filter(([id]) => bucket.runs.has(id))
      .map(([, q]) => q)
    const rounds = mean(scoped.map((q) => q.revisionRounds))
    const firstPass = rate(scoped.map((q) => q.reviewerFirstPass))
    const gates = rate(scoped.flatMap((q) => [q.typecheckPassed, q.lintPassed, q.buildPassed, q.testPassed]))
    rows.push({
      date,
      harnessVersion,
      provider,
      lane,
      role,
      runCount: bucket.runs.size,
      sampleSize: bucket.records,
      avgOutputTokens: round(avg(bucket, 'outputTokens')),
      avgCacheReadTokens: round(avg(bucket, 'cacheReadTokens')),
      avgProcessedTokens: round(avg(bucket, 'processedTokens')),
      avgRevisionRounds: num3(rounds.mean),
      firstPassRate: num3(firstPass.rate),
      verificationPassRate: num3(gates.rate),
    })
  }
  return rows
}

function versionSummary(records) {
  const byVersion = groupBy(records, (r) => r.harnessVersion ?? 'unrecorded')
  const qualityRuns = qualityByRun(records)
  const out = {}
  // Per-run figures use only records that carry a run id: an auto-detected
  // invocation nobody attributed to a run would otherwise inflate the per-run
  // average while contributing no run to divide by.
  const attributed = groupBy(
    records.filter((r) => r.runId),
    (r) => r.harnessVersion ?? 'unrecorded',
  )
  for (const [version, bucket] of byVersion) {
    const scoped = [...qualityRuns.entries()].filter(([id]) => bucket.runs.has(id)).map(([, q]) => q)
    const runScoped = attributed.get(version)
    const rounds = mean(scoped.map((q) => q.revisionRounds))
    const firstPass = rate(scoped.map((q) => q.reviewerFirstPass))
    const empty = (v) => (v === '' ? null : v)
    out[version] = {
      invocations: bucket.records,
      runs: bucket.runs.size,
      avgProcessedTokensPerInvocation: round(avg(bucket, 'processedTokens')),
      avgProcessedTokensPerRun: runScoped?.runs.size
        ? Math.round(runScoped.processedTokens / runScoped.runs.size)
        : null,
      avgOutputTokensPerInvocation: round(avg(bucket, 'outputTokens')),
      avgRevisionRounds: empty(num3(rounds.mean)),
      revisionRoundsSample: rounds.n,
      reviewerFirstPassRate: empty(num3(firstPass.rate)),
      reviewerFirstPassSample: firstPass.n,
    }
  }
  return out
}

// A change is only reported when both sides have enough runs to mean anything.
const MIN_RUNS_FOR_CHANGE = 3

function versionComparison(summary) {
  const versions = Object.keys(summary).filter((v) => v !== 'unrecorded').sort()
  const out = []
  for (let i = 1; i < versions.length; i++) {
    const from = summary[versions[i - 1]]
    const to = summary[versions[i]]
    const enough = from.runs >= MIN_RUNS_FOR_CHANGE && to.runs >= MIN_RUNS_FOR_CHANGE
    out.push({
      from: versions[i - 1],
      to: versions[i],
      sample: { fromRuns: from.runs, toRuns: to.runs },
      sufficientData: enough,
      processedTokensPerRunChangePct:
        enough && from.avgProcessedTokensPerRun
          ? Number(
              (
                ((to.avgProcessedTokensPerRun - from.avgProcessedTokensPerRun) /
                  from.avgProcessedTokensPerRun) *
                100
              ).toFixed(1),
            )
          : null,
      note: enough
        ? null
        : `sample too small: no change is computed below ${MIN_RUNS_FOR_CHANGE} runs per version`,
    })
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2), [])
  const since = args.days ? sinceISO(Number(args.days)) : null
  const { records, malformed } = await readHistory({ since })
  if (!records.length) {
    warn('no history records; run npm run harness:monitor first')
    process.exit(0)
  }
  if (malformed) warn(`${malformed} malformed history line(s) skipped`)

  const rows = csvRows(records)
  const summary = versionSummary(records)

  const header = Object.keys(rows[0])
  const csv = [header.join(','), ...rows.map((r) => header.map((h) => r[h]).join(','))].join('\n') + '\n'

  const summaryDoc = {
    generatedAt: new Date().toISOString(),
    totals: {
      invocations: records.length,
      runs: new Set(records.map((r) => r.runId).filter(Boolean)).size,
    },
    definitions: {
      processedTokens: 'fresh input + output + cache read + cache write',
      caveat: 'processedTokens != billing cost, != subscription usage, != actually charged tokens',
      providerComparison: 'raw token processing comparison only; no pricing model is applied',
      collection: 'local Node scripts parsing runtime transcripts; 0 AI calls',
    },
    byHarnessVersion: summary,
    versionComparison: versionComparison(summary),
    byProvider: Object.fromEntries(
      [...groupBy(records, (r) => r.provider)].map(([k, b]) => [
        k,
        {
          invocations: b.records,
          avgProcessedTokens: round(avg(b, 'processedTokens')),
          avgOutputTokens: round(avg(b, 'outputTokens')),
        },
      ]),
    ),
    byLane: Object.fromEntries(
      [...groupBy(records, (r) => r.lane ?? 'unrecorded')].map(([k, b]) => [
        k,
        { invocations: b.records, runs: b.runs.size, avgProcessedTokens: round(avg(b, 'processedTokens')) },
      ]),
    ),
    byRole: Object.fromEntries(
      [...groupBy(records, (r) => r.role)].map(([k, b]) => [
        k,
        {
          invocations: b.records,
          avgProcessedTokens: round(avg(b, 'processedTokens')),
          avgOutputTokens: round(avg(b, 'outputTokens')),
        },
      ]),
    ),
  }

  // Belt and braces: refuse to write anything carrying a runtime identifier.
  const serialized = JSON.stringify(summaryDoc)
  const leaked = FORBIDDEN.filter((f) => serialized.includes(`"${f}"`) || csv.includes(f))
  if (leaked.length) throw new Error(`refusing to write snapshot: ${leaked.join(', ')} present`)

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(path.join(OUT_DIR, 'history.csv'), csv)
  writeFileSync(path.join(OUT_DIR, 'summary.json'), `${JSON.stringify(summaryDoc, null, 2)}\n`)
  console.log(`[usage] snapshot written to ${OUT_DIR}/ - ${rows.length} row(s), ${records.length} invocation(s)`)
}

main().catch((e) => {
  warn(`snapshot failed: ${e.message}`)
  process.exit(1)
})
