// Codex usage adapter. It reads exactly one invocation transcript supplied by
// the orchestrator; normal collection never searches ~/.codex/sessions.

import { createReadStream, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { homedir } from 'node:os'
import path from 'node:path'

export const provider = 'codex'

const number = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0

function normalize(usage) {
  const rawInput = number(usage.input_tokens)
  const cachedInputTokens = number(usage.cached_input_tokens)
  const cacheWriteInputTokens = number(usage.cache_write_input_tokens)
  const inputTokens = Math.max(0, rawInput - cachedInputTokens - cacheWriteInputTokens)
  const outputTokens = number(usage.output_tokens)
  return {
    inputTokens,
    cachedInputTokens,
    cacheWriteInputTokens,
    outputTokens,
    reasoningOutputTokens: number(usage.reasoning_output_tokens),
    processedTokens: inputTokens + cachedInputTokens + cacheWriteInputTokens + outputTokens,
  }
}

export async function scanCodexTranscript(transcript) {
  const completed = []
  const fallback = []
  let model
  let sourceId
  let sessionCwd
  let firstTs
  let lastTs
  let malformed = 0

  const rl = createInterface({
    input: createReadStream(transcript, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (!line || line.charCodeAt(0) !== 123) continue
    let event
    try {
      event = JSON.parse(line)
    } catch {
      malformed++
      continue
    }

    const timestamp = event.timestamp ?? event.completed_at ?? event.started_at
    if (typeof timestamp === 'string') {
      if (!firstTs || timestamp < firstTs) firstTs = timestamp
      if (!lastTs || timestamp > lastTs) lastTs = timestamp
    }

    if (event.type === 'thread.started' && typeof event.thread_id === 'string') {
      sourceId = event.thread_id
    }
    if (event.type === 'session_meta') {
      sourceId = event.payload?.id ?? event.payload?.session_id ?? sourceId
      if (typeof event.payload?.cwd === 'string') sessionCwd = event.payload.cwd
    }
    if (event.type === 'turn_context' && typeof event.payload?.model === 'string') {
      model = event.payload.model
    }
    if (typeof event.model === 'string') model = event.model

    if (event.type === 'turn.completed') {
      if (event.usage && typeof event.usage === 'object') completed.push(event.usage)
      else malformed++
      continue
    }

    if (event.type === 'event_msg' && event.payload?.type === 'token_count') {
      const usage = event.payload.info?.last_token_usage
      if (usage && typeof usage === 'object') fallback.push(usage)
      else malformed++
    }
  }

  // `turn.completed` is authoritative for exec JSONL. Rollout token_count is
  // used only when no completed event exists. total_token_usage is cumulative
  // and intentionally never read or summed.
  const selected = completed.length ? completed : fallback
  if (!selected.length) throw new Error(`no Codex usage events found in ${path.basename(transcript)}`)

  const totals = {
    inputTokens: 0,
    cachedInputTokens: 0,
    cacheWriteInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    processedTokens: 0,
  }
  for (const usage of selected) {
    const item = normalize(usage)
    for (const key of Object.keys(totals)) totals[key] += item[key]
  }

  return {
    totals,
    model,
    sourceId,
    sessionCwd,
    firstTs,
    lastTs,
    malformed,
    usageSource: completed.length ? 'turn.completed.usage' : 'token_count.last_token_usage',
    events: selected.length,
  }
}

export async function collect({ role, round, transcriptPath, cwd }) {
  if (!transcriptPath) {
    throw new Error('Codex requires --transcript <invocation.jsonl>')
  }
  const transcript = path.resolve(cwd, transcriptPath)
  if (!existsSync(transcript)) throw new Error(`Codex transcript not found: ${transcript}`)

  const scan = await scanCodexTranscript(transcript)
  const durationMs =
    scan.firstTs && scan.lastTs ? Date.parse(scan.lastTs) - Date.parse(scan.firstTs) : undefined
  const resolvedSourceId = scan.sourceId ?? path.basename(transcript, path.extname(transcript))

  return {
    record: {
      provider,
      invocationId: `${role}-r${round}`,
      role,
      round,
      model: scan.model,
      startedAt: scan.firstTs,
      finishedAt: scan.lastTs,
      durationMs: Number.isFinite(durationMs) ? durationMs : undefined,
      ...scan.totals,
      sourceId: resolvedSourceId,
      transcriptPath: path.relative(cwd, transcript),
      source: path.relative(homedir(), transcript),
      usageSource: scan.usageSource,
      collectedAt: new Date().toISOString(),
    },
    malformed: scan.malformed,
  }
}
