// Claude Code usage adapter.
//
// Maps Claude Code's local transcript JSONL into the shared usage record shape
// defined in .harness/monitoring/usage-schema.md. Every field read here was
// verified against real transcripts produced by this environment; nothing is
// inferred.
//
// Layout (verified):
//   ~/.claude/projects/<slugified-cwd>/<sessionId>.jsonl          main session
//   ~/.claude/projects/<slugified-cwd>/<sessionId>/subagents/
//       agent-<agentId>.jsonl        subagent transcript
//       agent-<agentId>.meta.json    { agentType, description, toolUseId, spawnDepth }
//
// Usage lives on assistant lines at message.usage:
//   input_tokens, output_tokens, cache_read_input_tokens,
//   cache_creation_input_tokens
//
// Streaming caveat (verified): one API response is written as several assistant
// lines sharing the same message.id. The repeats carry the same input/cache
// values; output_tokens either repeats or grows. Records are therefore grouped
// by message.id and the largest output_tokens per group is taken. This holds
// for the main session transcript too (verified: 336 assistant lines / 239
// distinct message.id), so orchestrator measurement uses the same scan — there
// is exactly one token-normalization implementation in this adapter.

import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { homedir } from 'node:os'
import path from 'node:path'

export const provider = 'claude'

export function projectDir(cwd) {
  return path.join(homedir(), '.claude', 'projects', cwd.replace(/[^a-zA-Z0-9]/g, '-'))
}

export function newestSessionId(dir) {
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({ id: f.slice(0, -6), mtime: statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  return files.length ? files[0].id : null
}

// Claude agentType values come from .claude/agents/*; they already use the
// canonical Harness role names. Anything else is mapped explicitly or rejected.
const ROLE_BY_AGENT_TYPE = {
  planner: 'planner',
  implementer: 'implementer',
  reviewer: 'reviewer',
}

function readMeta(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

export function listSubagents(sessionDir) {
  const dir = path.join(sessionDir, 'subagents')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.startsWith('agent-') && f.endsWith('.jsonl'))
    .map((f) => {
      const transcript = path.join(dir, f)
      const agentId = f.slice('agent-'.length, -'.jsonl'.length)
      const meta = readMeta(path.join(dir, `agent-${agentId}.meta.json`)) ?? {}
      return {
        agentId,
        transcript,
        mtime: statSync(transcript).mtimeMs,
        role: ROLE_BY_AGENT_TYPE[meta.agentType] ?? null,
        agentType: meta.agentType ?? null,
      }
    })
    .sort((a, b) => b.mtime - a.mtime)
}

// Line-by-line scan. Only the per-message accumulator is retained, so the
// transcript is never held in memory and never leaves this process.
// This is the single normalization path: per-invocation collection and
// orchestrator snapshots both go through it.
export async function scanUsage(file, { mainSessionOnly = false } = {}) {
  const byMessage = new Map()
  let model = null
  let firstTs = null
  let lastTs = null
  let malformed = 0

  const rl = createInterface({
    input: createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (!line || line.charCodeAt(0) !== 123 /* { */) continue
    if (!line.includes('"assistant"')) continue
    let ev
    try {
      ev = JSON.parse(line)
    } catch {
      malformed++
      continue
    }
    if (ev?.type !== 'assistant') continue
    // The main session file also contains sidechain (subagent) lines; exclude
    // them so orchestrator usage is not inflated by its own children.
    if (mainSessionOnly && ev.isSidechain === true) continue
    const msg = ev.message
    const u = msg?.usage
    if (!u || typeof u !== 'object') {
      malformed++
      continue
    }
    const id = msg.id ?? ev.requestId ?? ev.uuid
    if (!id) {
      malformed++
      continue
    }
    const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
    const prev = byMessage.get(id)
    const next = {
      input: num(u.input_tokens),
      output: num(u.output_tokens),
      cacheRead: num(u.cache_read_input_tokens),
      cacheCreation: num(u.cache_creation_input_tokens),
    }
    // Same message.id repeats across streamed chunks: input/cache are constant,
    // output grows. Keep one copy of the constants and the largest output.
    byMessage.set(id, prev ? { ...prev, output: Math.max(prev.output, next.output) } : next)

    if (typeof msg.model === 'string' && msg.model) model = msg.model
    if (typeof ev.timestamp === 'string') {
      if (!firstTs || ev.timestamp < firstTs) firstTs = ev.timestamp
      if (!lastTs || ev.timestamp > lastTs) lastTs = ev.timestamp
    }
  }

  const totals = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 }
  for (const m of byMessage.values()) {
    totals.inputTokens += m.input
    totals.outputTokens += m.output
    totals.cacheReadTokens += m.cacheRead
    totals.cacheCreationTokens += m.cacheCreation
  }
  return { totals, model, firstTs, lastTs, messages: byMessage.size, malformed }
}

/**
 * Resolve one invocation into a shared-schema record.
 * Throws on a resolution problem; the caller downgrades it to a warning.
 */
export async function collect({ role, round, sourceId, sessionId, cwd, usedSourceIds = [] }) {
  const dir = projectDir(cwd)
  const session = sessionId || process.env.CLAUDE_SESSION_ID || newestSessionId(dir)
  if (!session) throw new Error(`no Claude session transcript under ${dir}`)
  const sessionDir = path.join(dir, session)

  if (role === 'orchestrator') {
    // Orchestrator usage is a run-boundary delta, not a whole-transcript scan:
    // the main session outlives the run. See runSnapshot() and run-boundary.mjs.
    throw new Error(
      'orchestrator usage is measured as a run delta; ' +
        'use harness:usage:start / harness:usage:end instead of collect',
    )
  }

  let transcript
  let resolvedSourceId
  const scanOpts = {}

  {
    const agents = listSubagents(sessionDir)
    if (!agents.length) throw new Error(`no subagent transcripts under ${sessionDir}/subagents`)
    let picked
    if (sourceId) {
      picked = agents.find((a) => a.agentId === sourceId)
      if (!picked) throw new Error(`agent id ${sourceId} not found in session ${session}`)
      if (picked.role && picked.role !== role) {
        throw new Error(`agent ${sourceId} is agentType "${picked.agentType}", not role "${role}"`)
      }
    } else {
      // No agent id available: stay inside the current session, match the
      // logical role, and take the most recent transcript not already charged
      // to another invocation. This is what keeps an earlier round's agent from
      // being counted again as the current one.
      const candidates = agents.filter((a) => a.role === role && !usedSourceIds.includes(a.agentId))
      if (!candidates.length) {
        throw new Error(
          `no unclaimed "${role}" subagent transcript in session ${session}; ` +
            `pass --agent-id to disambiguate`,
        )
      }
      picked = candidates[0]
    }
    transcript = picked.transcript
    resolvedSourceId = picked.agentId
  }

  const scan = await scanUsage(transcript, scanOpts)
  if (!scan.messages) throw new Error(`no usage events found in ${path.basename(transcript)}`)

  const durationMs =
    scan.firstTs && scan.lastTs ? Date.parse(scan.lastTs) - Date.parse(scan.firstTs) : null

  const record = {
    provider,
    invocationId: `${role}-r${round}`,
    role,
    round,
    model: scan.model ?? undefined,
    startedAt: scan.firstTs ?? undefined,
    finishedAt: scan.lastTs ?? undefined,
    durationMs: Number.isFinite(durationMs) ? durationMs : undefined,
    ...scan.totals,
    cachedInputTokens: scan.totals.cacheReadTokens,
    cacheWriteInputTokens: scan.totals.cacheCreationTokens,
    reasoningOutputTokens: 0,
    processedTokens:
      scan.totals.inputTokens +
      scan.totals.outputTokens +
      scan.totals.cacheReadTokens +
      scan.totals.cacheCreationTokens,
    sourceId: resolvedSourceId,
    source: path.relative(homedir(), transcript),
    transcriptPath: path.relative(cwd, transcript),
    collectedAt: new Date().toISOString(),
  }
  return { record, malformed: scan.malformed }
}

/**
 * Cumulative orchestrator usage for a session, as of now.
 *
 * The main session transcript is append-only and outlives a Harness run, so a
 * single scan is a *cumulative* figure. Run-scoped orchestrator usage is the
 * difference between two of these snapshots (see run-boundary.mjs) rather than
 * a timestamp filter: a snapshot delta cannot be thrown off by a boundary
 * landing in the middle of a response that spans several transcript lines.
 *
 * Sidechain (subagent) lines are excluded so subagent usage, already recorded
 * per invocation, is not counted a second time here.
 */
export async function runSnapshot({ sessionId, cwd }) {
  const dir = projectDir(cwd)
  const session = sessionId || process.env.CLAUDE_SESSION_ID || newestSessionId(dir)
  if (!session) throw new Error(`no Claude session transcript under ${dir}`)
  const transcript = path.join(dir, `${session}.jsonl`)
  if (!existsSync(transcript)) throw new Error(`main transcript not found: ${transcript}`)

  const scan = await scanUsage(transcript, { mainSessionOnly: true })
  return {
    sessionId: session,
    at: new Date().toISOString(),
    lastEventAt: scan.lastTs ?? undefined,
    model: scan.model ?? undefined,
    messages: scan.messages,
    malformed: scan.malformed,
    cumulative: { ...scan.totals },
    source: path.relative(homedir(), transcript),
  }
}
