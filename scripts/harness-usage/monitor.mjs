#!/usr/bin/env node
// Harness usage monitor — a local, zero-AI watcher.
//
//   npm run harness:monitor              # long-lived watcher
//   npm run harness:monitor -- --once    # one incremental pass, then exit
//   npm run harness:monitor -- --no-orchestrator   # debugging: leave the main
//        session alone and use manual harness:usage:start/end deltas instead
//
// It spawns no agent, sends nothing anywhere, and reads transcripts line by
// line for their usage numbers only. AI calls caused by monitoring: 0.
//
// Sources, in descending attribution quality:
//
//   1. _workspace/{slug}/usage.json — records the existing collectors wrote.
//      Role, round and run are stated by the orchestrator, so these are
//      `attribution: "harness"`.
//   1b. _workspace/{slug}/runtime/codex-{role}-r{n}.jsonl — a Codex invocation
//      file the orchestrator named when it ran it. Role, round and run come
//      from that name, so Codex invocations are attributed without any manual
//      collect step and without reading transcript content.
//   2. Claude subagent transcripts for this project directory. Role comes from
//      the sibling agent-*.meta.json `agentType` — a file, not an inference.
//   2b. The Claude main session transcript, read incrementally from a stored
//      byte offset and recorded as `orchestrator`. Never the session-cumulative
//      total; sidechain (subagent) lines are excluded.
//   3. Codex rollout JSONL whose session_meta cwd is this project. A rollout the
//      Harness did not name carries no role, so it stays `unknown` rather than
//      being guessed; one that matches a named invocation collapses onto it.
//
// A record observed by both 1 and 2/3 collapses on read (provider + sourceId),
// with the harness-attributed copy winning. Re-running the monitor, or
// restarting it, therefore never double-counts.
//
// Incremental by construction: a per-file cursor (size + mtime) is persisted,
// unchanged files are skipped without being opened, and a file is only ingested
// once it has been quiet for --quiet ms so a still-running agent is not
// recorded half-finished.

import { existsSync, readdirSync, statSync, watch } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import * as claude from './providers/claude.mjs'
import * as codex from './providers/codex.mjs'
import { appendRecords, knownKeys, loadState, saveState } from './lib/history.mjs'
import { ATTRIBUTION_RANK, recordKey, toHistoryRecord } from './lib/schema.mjs'
import { harnessVersion, runMeta } from './lib/runmeta.mjs'
import { parseArgs, warn } from './store.mjs'

const ROOT = process.cwd()
const args = parseArgs(process.argv.slice(2), ['once', 'verbose', 'no-orchestrator'])
const QUIET_MS = Number(args.quiet ?? 15_000)
const POLL_MS = Math.max(5_000, Number(args.interval ?? 30_000))
const VERBOSE = Boolean(args.verbose)

const log = (msg) => console.log(`[monitor] ${msg}`)
const debug = (msg) => VERBOSE && console.log(`[monitor] ${msg}`)

function safeStat(file) {
  try {
    return statSync(file)
  } catch {
    return null
  }
}

/** True when the file changed since the cursor and has since gone quiet. */
function changedAndSettled(cursor, stat, now) {
  if (!stat) return false
  if (cursor && cursor.size === stat.size && cursor.mtimeMs === stat.mtimeMs) return false
  return now - stat.mtimeMs >= QUIET_MS
}

// ---------------------------------------------------------------- source 1
function workspaceRunDocs() {
  const ws = path.join(ROOT, '_workspace')
  if (!existsSync(ws)) return []
  return readdirSync(ws)
    .map((slug) => ({ slug, file: path.join(ws, slug, 'usage.json') }))
    .filter((entry) => existsSync(entry.file))
}

async function ingestRunDocs(state, now, out) {
  const { readFileSync } = await import('node:fs')
  for (const { slug, file } of workspaceRunDocs()) {
    const stat = safeStat(file)
    const cursor = state.providers.workspace?.[file]
    if (!changedAndSettled(cursor, stat, now)) continue
    let doc
    try {
      doc = JSON.parse(readFileSync(file, 'utf8'))
    } catch (e) {
      warn(`${path.relative(ROOT, file)} is unreadable (${e.message}); skipped`)
      continue
    }
    const meta = runMeta(slug, ROOT)
    for (const agent of Array.isArray(doc.agents) ? doc.agents : []) {
      // The Claude orchestrator is measured automatically from the main session
      // now. A manual harness:usage:start/end delta covers exactly the same
      // tokens, so ingesting both would double-count; the manual record is
      // skipped unless auto collection is switched off for debugging.
      const provider = agent.provider ?? doc.provider ?? 'unknown'
      if (
        !args['no-orchestrator'] &&
        provider === 'claude' &&
        agent.role === 'orchestrator' &&
        agent.measurementMode === 'run_delta'
      ) {
        continue
      }
      out.push(
        toHistoryRecord(
          { ...agent, provider, status: 'completed' },
          {
            runId: doc.run ?? slug,
            harnessVersion: harnessVersion(ROOT),
            lane: meta.lane,
            laneSource: meta.laneSource,
            layer: meta.layer,
            quality: meta.quality,
            attribution: 'harness',
          },
        ),
      )
    }
    state.providers.workspace ??= {}
    state.providers.workspace[file] = { size: stat.size, mtimeMs: stat.mtimeMs }
  }
}

// ---------------------------------------------------------------- source 2
function claudeSessionDirs() {
  const dir = claude.projectDir(ROOT)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .map((entry) => path.join(dir, entry))
    .filter((entry) => existsSync(path.join(entry, 'subagents')))
}

async function ingestClaude(state, now, out) {
  for (const sessionDir of claudeSessionDirs()) {
    for (const agent of claude.listSubagents(sessionDir)) {
      if (!agent.role) continue // unmapped agentType: not a Harness role
      const stat = safeStat(agent.transcript)
      const cursor = state.providers.claude?.[agent.agentId]
      if (!changedAndSettled(cursor, stat, now)) continue
      let scan
      try {
        scan = await claude.scanUsage(agent.transcript)
      } catch (e) {
        warn(`claude ${agent.agentId}: ${e.message}`)
        continue
      }
      state.providers.claude ??= {}
      state.providers.claude[agent.agentId] = { size: stat.size, mtimeMs: stat.mtimeMs }
      if (!scan.messages) continue
      if (scan.malformed) debug(`claude ${agent.agentId}: ${scan.malformed} unusable event(s) skipped`)
      const durationMs =
        scan.firstTs && scan.lastTs ? Date.parse(scan.lastTs) - Date.parse(scan.firstTs) : undefined
      out.push(
        toHistoryRecord(
          {
            provider: 'claude',
            role: agent.role,
            round: 1,
            model: scan.model,
            finishedAt: scan.lastTs,
            durationMs,
            ...scan.totals,
            reasoningOutputTokens: 0,
            sourceId: agent.agentId,
            status: 'completed',
          },
          { harnessVersion: harnessVersion(ROOT), attribution: 'auto' },
        ),
      )
    }
  }
}

// ------------------------------------------------- source 2b: orchestrator
//
// The orchestrator drives the run from the main session transcript, which is
// append-only and outlives any single run. It is therefore read *incrementally*
// from a persisted byte offset: each pass records only what was appended since
// the previous one, never the session-cumulative total. That keeps the numbers
// on the same per-slice footing the run-boundary delta produced, without the
// user having to type start/end.
//
// A message.id repeated across passes (a streamed response split by the offset
// boundary) contributes only its growth, because the per-message figures
// already recorded are kept in the cursor.

const RECENT_MESSAGES = 80

function orchestratorSlice(scan, recorded) {
  const totals = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 }
  const seen = {}
  for (const [id, m] of scan.byMessage) {
    const prev = recorded[id]
    // Only the increase counts: input/cache stay constant across a streamed
    // response and output grows, so a message seen in an earlier pass adds only
    // what it gained since.
    totals.inputTokens += prev ? Math.max(0, m.input - prev.i) : m.input
    totals.outputTokens += prev ? Math.max(0, m.output - prev.o) : m.output
    totals.cacheReadTokens += prev ? Math.max(0, m.cacheRead - prev.r) : m.cacheRead
    totals.cacheCreationTokens += prev ? Math.max(0, m.cacheCreation - prev.w) : m.cacheCreation
    seen[id] = { i: m.input, o: m.output, r: m.cacheRead, w: m.cacheCreation }
  }
  return { totals, seen }
}

/**
 * Resume point for a session whose cursor was lost: the highest end offset
 * already recorded in the history for it. Without this a deleted state file
 * would re-record the whole session as one new slice.
 */
function offsetFromHistory(known, sessionId) {
  let max = 0
  for (const key of known.keys()) {
    const [provider, sourceId] = key.split('|')
    if (provider !== 'claude' || !sourceId?.startsWith(`${sessionId}#`)) continue
    const end = Number(sourceId.split('-').pop())
    if (Number.isFinite(end) && end > max) max = end
  }
  return max
}

/**
 * The run a main-session slice belongs to, or null.
 *
 * A slice is orchestrator work between two transcript timestamps; the run it
 * drove is the one whose `_workspace/{slug}` directory was written inside that
 * window. This is a file-mtime fact, not an inference from transcript content.
 * If no run or more than one run matches, the slice stays unattributed rather
 * than being assigned to a guess.
 */
function runForSlice(firstTs, lastTs) {
  if (!firstTs || !lastTs) return null
  const from = Date.parse(firstTs)
  const to = Date.parse(lastTs)
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null
  const ws = path.join(ROOT, '_workspace')
  if (!existsSync(ws)) return null
  const matches = readdirSync(ws).filter((slug) => {
    const stat = safeStat(path.join(ws, slug))
    return stat && stat.mtimeMs >= from && stat.mtimeMs <= to
  })
  return matches.length === 1 ? matches[0] : null
}

async function ingestClaudeOrchestrator(state, now, out, known) {
  if (args['no-orchestrator']) return
  for (const { sessionId, transcript } of claude.listMainSessions(ROOT)) {
    const stat = safeStat(transcript)
    state.providers.claudeMain ??= {}
    const cursor = state.providers.claudeMain[sessionId]
    if (!changedAndSettled(cursor, stat, now)) continue

    const start = cursor?.offset ?? offsetFromHistory(known, sessionId)
    let scan
    try {
      // Sidechain lines are subagent usage, already recorded per invocation.
      scan = await claude.scanUsage(transcript, { mainSessionOnly: true, start })
    } catch (e) {
      warn(`claude orchestrator ${sessionId}: ${e.message}`)
      continue
    }
    const { totals, seen } = orchestratorSlice(scan, cursor?.messages ?? {})
    const messages = { ...(cursor?.messages ?? {}), ...seen }
    const trimmed = Object.fromEntries(Object.entries(messages).slice(-RECENT_MESSAGES))
    state.providers.claudeMain[sessionId] = {
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      offset: scan.endOffset,
      messages: trimmed,
    }
    const processed = Object.values(totals).reduce((a, b) => a + b, 0)
    if (!processed) continue
    // Same runId as the run's agent records, so run totals add up.
    const runId = runForSlice(scan.firstTs, scan.lastTs)
    const runMetaForSlice = runId ? runMeta(runId, ROOT) : null
    const sliceRun = runId
      ? {
          runId,
          lane: runMetaForSlice.lane,
          laneSource: runMetaForSlice.laneSource,
          layer: runMetaForSlice.layer,
          quality: runMetaForSlice.quality,
        }
      : {}
    if (scan.malformed) debug(`claude orchestrator ${sessionId}: ${scan.malformed} unusable event(s) skipped`)
    out.push(
      toHistoryRecord(
        {
          provider: 'claude',
          role: 'orchestrator',
          round: 1,
          model: scan.model,
          finishedAt: scan.lastTs,
          durationMs:
            scan.firstTs && scan.lastTs ? Date.parse(scan.lastTs) - Date.parse(scan.firstTs) : undefined,
          ...totals,
          reasoningOutputTokens: 0,
          // The slice's byte range makes each increment its own identity, so a
          // re-observed slice collapses instead of accumulating.
          sourceId: `${sessionId}#${scan.fromOffset}-${scan.endOffset}`,
          measurementMode: 'run_delta',
          status: 'completed',
        },
        {
          harnessVersion: harnessVersion(ROOT),
          attribution: 'auto',
          ...sliceRun,
        },
      ),
    )
  }
}

// ------------------------------------------------- source 3a: codex by role
//
// The orchestrator already names each Codex invocation file when it runs it:
// _workspace/{slug}/runtime/codex-{role}-r{n}.jsonl. Role, round and run come
// from that name — metadata chosen at invocation time, never inferred from
// transcript content and never classified by a model. A name that does not
// match is skipped rather than guessed.

const RUNTIME_NAME = /^codex-(planner|implementer|reviewer)(?:-r(\d+))?\.jsonl$/

function codexRuntimeFiles() {
  const ws = path.join(ROOT, '_workspace')
  if (!existsSync(ws)) return []
  const files = []
  for (const slug of readdirSync(ws)) {
    const dir = path.join(ws, slug, 'runtime')
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      const match = RUNTIME_NAME.exec(name)
      if (!match) continue
      files.push({
        file: path.join(dir, name),
        runId: slug,
        role: match[1],
        round: Number(match[2] ?? 1),
      })
    }
  }
  return files
}

async function ingestCodexRuntime(state, now, out) {
  for (const { file, runId, role, round } of codexRuntimeFiles()) {
    const stat = safeStat(file)
    const key = path.relative(ROOT, file)
    const cursor = state.providers.codexRuntime?.[key]
    if (!changedAndSettled(cursor, stat, now)) continue
    state.providers.codexRuntime ??= {}
    state.providers.codexRuntime[key] = { size: stat.size, mtimeMs: stat.mtimeMs }
    let scan
    try {
      // Same parser as before: turn.completed.usage first, last_token_usage as
      // the fallback, cumulative total_token_usage never summed.
      scan = await codex.scanCodexTranscript(file)
    } catch (e) {
      warn(`codex ${key}: ${e.message}`)
      continue
    }
    if (scan.malformed) debug(`codex ${key}: ${scan.malformed} unusable event(s) skipped`)
    const meta = runMeta(runId, ROOT)
    out.push(
      toHistoryRecord(
        {
          provider: 'codex',
          role,
          round,
          model: scan.model,
          finishedAt: scan.lastTs,
          durationMs:
            scan.firstTs && scan.lastTs ? Date.parse(scan.lastTs) - Date.parse(scan.firstTs) : undefined,
          ...scan.totals,
          // The thread id, so the same invocation seen as a ~/.codex rollout
          // collapses onto this better-attributed record.
          sourceId: scan.sourceId ?? key,
          status: 'completed',
        },
        {
          runId,
          harnessVersion: harnessVersion(ROOT),
          lane: meta.lane,
          laneSource: meta.laneSource,
          layer: meta.layer,
          quality: meta.quality,
          attribution: 'harness',
        },
      ),
    )
  }
}

// ---------------------------------------------------------------- source 3
function codexRolloutFiles() {
  const base = path.join(homedir(), '.codex', 'sessions')
  if (!existsSync(base)) return []
  // Date-partitioned as sessions/YYYY/MM/DD. Only the newest --days partitions
  // are listed, so the tree is never walked whole.
  const days = Math.max(1, Number(args.days ?? 2))
  const newest = (dir, n) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((e) => /^\d+$/.test(e))
          .sort()
          .slice(-n)
          .map((e) => path.join(dir, e))
      : []
  const files = []
  for (const y of newest(base, 1)) {
    for (const m of newest(y, 1)) {
      for (const d of newest(m, days)) {
        for (const f of readdirSync(d)) {
          if (f.endsWith('.jsonl')) files.push(path.join(d, f))
        }
      }
    }
  }
  return files
}

async function ingestCodex(state, now, out) {
  for (const file of codexRolloutFiles()) {
    const stat = safeStat(file)
    const key = path.basename(file)
    const cursor = state.providers.codex?.[key]
    if (!changedAndSettled(cursor, stat, now)) continue
    state.providers.codex ??= {}
    state.providers.codex[key] = { size: stat.size, mtimeMs: stat.mtimeMs }
    let scan
    try {
      scan = await codex.scanCodexTranscript(file)
    } catch {
      continue // no usage events in this rollout: nothing to record
    }
    // Only this project's sessions. An unknown cwd is not assumed to be ours.
    if (scan.sessionCwd !== ROOT) continue
    if (scan.malformed) debug(`codex ${key}: ${scan.malformed} unusable event(s) skipped`)
    const durationMs =
      scan.firstTs && scan.lastTs ? Date.parse(scan.lastTs) - Date.parse(scan.firstTs) : undefined
    out.push(
      toHistoryRecord(
        {
          provider: 'codex',
          // Codex records no Harness role. Never guessed from content.
          role: 'unknown',
          round: 1,
          model: scan.model,
          finishedAt: scan.lastTs,
          durationMs,
          ...scan.totals,
          sourceId: scan.sourceId ?? key,
          status: 'completed',
        },
        { harnessVersion: harnessVersion(ROOT), attribution: 'auto' },
      ),
    )
  }
}

// ---------------------------------------------------------------- pass
async function pass() {
  const now = Date.now()
  const state = loadState(ROOT)
  state.providers ??= {}
  const candidates = []
  const known = await knownKeys(ROOT)

  for (const [name, fn] of [
    ['workspace', ingestRunDocs],
    ['claude', ingestClaude],
    ['claude-orchestrator', ingestClaudeOrchestrator],
    ['codex-runtime', ingestCodexRuntime],
    ['codex', ingestCodex],
  ]) {
    try {
      await fn(state, now, candidates, known)
    } catch (e) {
      // Monitoring failure is never a feature failure.
      warn(`${name} source failed: ${e.message}`)
    }
  }

  const fresh = []
  const seen = new Set()
  for (const record of candidates) {
    const key = recordKey(record)
    const rank = ATTRIBUTION_RANK[record.attribution] ?? 0
    // Skip anything already stored at equal or better attribution, so a restart
    // re-observing the same transcript adds nothing.
    if ((known.get(key) ?? -1) >= rank) continue
    if (seen.has(key)) continue
    seen.add(key)
    fresh.push(record)
  }

  if (fresh.length) {
    appendRecords(fresh, ROOT)
    for (const r of fresh) {
      log(`+ ${r.provider}/${r.role}${r.runId ? `@${r.runId}` : ''} ${r.processedTokens.toLocaleString('en-US')} processed`)
    }
  } else debug('no new usage')

  state.lastPassAt = new Date(now).toISOString()
  saveState(state, ROOT)
  return fresh.length
}

// ---------------------------------------------------------------- watch
async function main() {
  log(`watching (quiet ${QUIET_MS}ms, poll ${POLL_MS}ms) — no AI calls are made by monitoring`)
  await pass()
  if (args.once) return

  let timer = null
  const schedule = (delay) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(run, delay)
    timer.unref?.()
  }
  async function run() {
    try {
      await pass()
    } catch (e) {
      warn(e.message)
    }
    schedule(POLL_MS)
  }

  // fs.watch on a handful of directories, debounced into the same pass the poll
  // uses. The poll is the safety net for platforms where watch events are lost;
  // neither path busy-loops.
  const watched = [
    path.join(ROOT, '_workspace'),
    ...claudeSessionDirs().map((d) => path.join(d, 'subagents')),
  ].filter((d) => existsSync(d))
  for (const dir of watched) {
    try {
      const w = watch(dir, { persistent: true }, () => schedule(QUIET_MS + 1_000))
      w.on('error', (e) => warn(`watch ${path.relative(ROOT, dir)}: ${e.message}`))
    } catch (e) {
      warn(`cannot watch ${dir}: ${e.message}`)
    }
  }
  log(`watching ${watched.length} director${watched.length === 1 ? 'y' : 'ies'} + ${POLL_MS / 1000}s poll · Ctrl-C to stop`)
  schedule(POLL_MS)
  await new Promise(() => {})
}

main().catch((e) => {
  warn(`monitor stopped: ${e.message}`)
  // Exit 0: a dead monitor must never look like a failed build step.
  process.exit(0)
})
