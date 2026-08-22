#!/usr/bin/env node
// Harness usage monitor — a local, zero-AI watcher.
//
//   npm run harness:monitor          # long-lived watcher
//   npm run harness:monitor -- --once   # one incremental pass, then exit
//
// It spawns no agent, sends nothing anywhere, and reads transcripts line by
// line for their usage numbers only. AI calls caused by monitoring: 0.
//
// Sources, in descending attribution quality:
//
//   1. _workspace/{slug}/usage.json — records the existing collectors wrote.
//      Role, round and run are stated by the orchestrator, so these are
//      `attribution: "harness"`. Claude orchestrator records stay run-boundary
//      deltas; the monitor never rescans a main session transcript, so the
//      delta logic can never regress to session-cumulative.
//   2. Claude subagent transcripts for this project directory. Role comes from
//      the sibling agent-*.meta.json `agentType` — a file, not an inference.
//      These are `attribution: "auto"` and fill in invocations nobody collected.
//   3. Codex rollout JSONL whose session_meta cwd is this project. Codex does
//      not record a Harness role, so role is `unknown` rather than guessed.
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
const args = parseArgs(process.argv.slice(2), ['once', 'verbose'])
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
      out.push(
        toHistoryRecord(
          { ...agent, provider: agent.provider ?? doc.provider ?? 'unknown', status: 'completed' },
          {
            runId: doc.run ?? slug,
            harnessVersion: harnessVersion(ROOT),
            lane: meta.lane,
            laneSource: meta.laneSource,
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

  for (const [name, fn] of [
    ['workspace', ingestRunDocs],
    ['claude', ingestClaude],
    ['codex', ingestCodex],
  ]) {
    try {
      await fn(state, now, candidates)
    } catch (e) {
      // Monitoring failure is never a feature failure.
      warn(`${name} source failed: ${e.message}`)
    }
  }

  const known = await knownKeys(ROOT)
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
