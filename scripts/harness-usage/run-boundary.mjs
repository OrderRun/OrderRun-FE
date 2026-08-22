#!/usr/bin/env node
// Harness run boundary — orchestrator usage as a per-run delta.
//
// The main session transcript is append-only and outlives a single Harness run,
// so scanning it whole yields a session-cumulative figure that is not
// comparable with the per-invocation figures recorded for planner /
// implementer / reviewer. Instead:
//
//   run start -> store a cumulative snapshot as the run's baseline
//   run end   -> take a second snapshot; orchestrator usage = end - baseline
//
// A snapshot delta is used rather than a timestamp filter so a boundary that
// lands in the middle of a response spanning several transcript lines cannot
// skew the result, and so tokens spent before the run started are never
// attributed to it.
//
// Local script only — no AI agent is involved at any point. Every failure is a
// MONITORING WARNING recorded on the run document; the process exits 0 so the
// feature workflow is never blocked by monitoring.
//
//   node scripts/harness-usage/run-boundary.mjs start --run <slug> [--lane A|B|C] [--session <id>]
//   node scripts/harness-usage/run-boundary.mjs end   --run <slug> [--session <id>]

import * as claude from './providers/claude.mjs'
import {
  FIELDS,
  addWarning,
  fmt,
  loadUsage,
  parseArgs,
  saveUsage,
  usagePath,
  warn,
} from './store.mjs'

const ADAPTERS = { claude }

function diff(end, start) {
  const out = {}
  for (const f of FIELDS) out[f] = (end[f] ?? 0) - (start[f] ?? 0)
  return out
}

async function start(args, doc, adapter) {
  const snap = await adapter.runSnapshot({ sessionId: args.session, cwd: process.cwd() })
  if (doc.runBoundary?.baseline && !doc.runBoundary.endedAt && !args.force) {
    // Re-running start inside an open run would silently discard the tokens
    // already spent in it, so the existing baseline is kept.
    warn(
      `run "${doc.run}" already has an open baseline from ${doc.runBoundary.startedAt}; ` +
        `keeping it (pass --force to reset)`,
    )
    return doc.runBoundary
  }
  doc.runBoundary = {
    provider: doc.provider,
    sessionId: snap.sessionId,
    startedAt: snap.at,
    measurementMode: 'run_delta',
    baseline: snap.cumulative,
    source: snap.source,
  }
  if (snap.malformed) warn(`${snap.malformed} malformed or usage-less event(s) skipped`)
  console.log(
    `[usage] ${doc.run} run started · orchestrator baseline ` +
      `${fmt(Object.values(snap.cumulative).reduce((a, b) => a + b, 0))} processed ` +
      `(session ${snap.sessionId})`,
  )
  return doc.runBoundary
}

async function end(args, doc, adapter) {
  const b = doc.runBoundary
  if (!b?.baseline) {
    throw new Error(
      `no orchestrator baseline for run "${doc.run}"; run harness:usage:start before the run`,
    )
  }
  const snap = await adapter.runSnapshot({
    sessionId: args.session ?? b.sessionId,
    cwd: process.cwd(),
  })
  if (snap.sessionId !== b.sessionId) {
    throw new Error(
      `baseline was taken in session ${b.sessionId} but the end snapshot is from ` +
        `${snap.sessionId}; the delta would be meaningless`,
    )
  }
  if (snap.malformed) warn(`${snap.malformed} malformed or usage-less event(s) skipped`)

  const delta = diff(snap.cumulative, b.baseline)
  const negative = FIELDS.filter((f) => delta[f] < 0)
  if (negative.length) {
    // A shrinking cumulative total means the transcript was truncated, rotated
    // or replaced. Recording that as usage would be a fabricated number.
    throw new Error(
      `orchestrator delta is negative for ${negative.join(', ')}; ` +
        `the transcript changed under the baseline, so no record was written`,
    )
  }

  b.endedAt = snap.at
  b.endSnapshot = snap.cumulative
  b.sessionCumulative = snap.cumulative

  const record = {
    provider: doc.provider,
    invocationId: 'orchestrator-r1',
    role: 'orchestrator',
    round: 1,
    measurementMode: 'run_delta',
    model: snap.model ?? undefined,
    startedAt: b.startedAt,
    finishedAt: b.endedAt,
    durationMs: Date.parse(b.endedAt) - Date.parse(b.startedAt),
    ...delta,
    totalTokens: FIELDS.reduce((a, f) => a + delta[f], 0),
    cachedInputTokens: delta.cacheReadTokens,
    cacheWriteInputTokens: delta.cacheCreationTokens,
    reasoningOutputTokens: 0,
    processedTokens: FIELDS.reduce((a, f) => a + delta[f], 0),
    sourceId: `${b.sessionId}#run`,
    source: snap.source,
    collectedAt: snap.at,
  }

  // Idempotent: re-running end replaces the single orchestrator record and
  // recomputes the delta from the unchanged baseline. It never accumulates.
  const i = doc.agents.findIndex((a) => a.role === 'orchestrator')
  if (i >= 0) doc.agents[i] = record
  else doc.agents.push(record)

  console.log(
    `[usage] ${doc.run} run ended · orchestrator delta ${fmt(record.totalTokens)} processed ` +
      `(in ${fmt(record.inputTokens)}, out ${fmt(record.outputTokens)}, ` +
      `cacheRead ${fmt(record.cacheReadTokens)}, cacheWrite ${fmt(record.cacheCreationTokens)})`,
  )
  return record
}

async function main() {
  const args = parseArgs(process.argv.slice(2), ['strict', 'force'])
  const phase = args._[0]
  let doc = null
  let file = null

  try {
    if (phase !== 'start' && phase !== 'end') {
      throw new Error('first argument must be "start" or "end"')
    }
    if (!args.run) throw new Error('--run <slug> is required')
    const providerName = args.provider ?? 'claude'
    const adapter = ADAPTERS[providerName]
    if (!adapter) throw new Error(`no usage adapter for provider "${providerName}"`)
    if (typeof adapter.runSnapshot !== 'function') {
      throw new Error(`provider "${providerName}" does not support run-boundary snapshots`)
    }

    file = usagePath(args.run)
    doc = loadUsage(file, { run: args.run, provider: providerName })
    // Declared once at run start, it labels every record of the run.
    if (['A', 'B', 'C'].includes(args.lane)) doc.lane = args.lane

    if (phase === 'start') await start(args, doc, adapter)
    else await end(args, doc, adapter)

    saveUsage(file, doc)
  } catch (e) {
    try {
      if (doc && file) {
        addWarning(doc, `run ${phase}: ${e.message}`)
        saveUsage(file, doc)
      } else {
        warn(e.message)
      }
    } catch {
      warn(e.message)
    }
    warn('orchestrator usage not recorded; this does not affect the verification gate')
    process.exit(args.strict ? 1 : 0)
  }
}

main()
