#!/usr/bin/env node
// Harness usage collector — records one agent invocation into
// _workspace/{slug}/usage.json.
//
// Local script only. It never spawns an AI agent and never feeds transcript
// content into any model context. Any failure here is a MONITORING WARNING: it
// exits 0 so a collector problem can never fail a feature.
//
//   node scripts/harness-usage/collect.mjs --run <slug> --role <role> --round <n>
//        [--agent-id <id>] [--session <id>] [--transcript <file>]
//        [--provider claude|codex] [--lane A|B|C] [--strict]
//
// Claude orchestrator usage uses run-boundary.mjs. A Codex orchestrator is an
// explicit exec invocation and is collected from its own --transcript file.

import * as claude from './providers/claude.mjs'
import * as codex from './providers/codex.mjs'
import {
  ROLES,
  addWarning,
  fmt,
  loadUsage,
  parseArgs,
  saveUsage,
  usagePath,
  warn,
} from './store.mjs'

const ADAPTERS = { claude, codex }

async function main() {
  const args = parseArgs(process.argv.slice(2), ['strict'])
  const strict = Boolean(args.strict)

  try {
    const run = args.run
    const role = args.role
    const round = Number(args.round ?? 1)
    const providerName = args.provider ?? 'claude'

    if (!run) throw new Error('--run <slug> is required')
    if (!ROLES.includes(role)) throw new Error(`--role must be one of ${ROLES.join(', ')}`)
    if (!Number.isInteger(round) || round < 1) throw new Error('--round must be a positive integer')
    const adapter = ADAPTERS[providerName]
    if (!adapter) throw new Error(`no usage adapter for provider "${providerName}"`)

    const file = usagePath(run)
    const doc = loadUsage(file, { run, provider: providerName })
    // A declared Lane is the only trustworthy one; without it the monitor falls
    // back to what the run's own artifacts show.
    if (['A', 'B', 'C'].includes(args.lane)) doc.lane = args.lane
    const invocationId = `${role}-r${round}`

    // Source ids already charged to a *different* invocation are off limits, so
    // re-running the collector for one invocation stays idempotent while a
    // stale transcript can never be counted twice.
    const usedSourceIds = doc.agents
      .filter((a) => (a.provider ?? doc.provider ?? 'claude') === providerName)
      .filter((a) => a.invocationId !== invocationId)
      .map((a) => a.sourceId)
      .filter(Boolean)

    const { record, malformed } = await adapter.collect({
      runSlug: run,
      role,
      round,
      sourceId: args['agent-id'],
      sessionId: args.session,
      cwd: process.cwd(),
      usedSourceIds,
      transcriptPath: args.transcript,
    })

    if (usedSourceIds.includes(record.sourceId)) {
      throw new Error(
        `source ${record.sourceId} is already recorded under a different invocation; ` +
          `refusing to double-count`,
      )
    }
    if (malformed) warn(`${malformed} malformed or usage-less event(s) skipped`)

    const existing = doc.agents.findIndex(
      (a) =>
        (a.provider ?? doc.provider ?? 'claude') === providerName &&
        a.invocationId === invocationId,
    )
    if (existing >= 0) doc.agents[existing] = record
    else doc.agents.push(record)

    saveUsage(file, doc)

    console.log(
      `[usage] ${run} ${providerName}/${invocationId}: processed ${fmt(record.processedTokens)} ` +
        `(in ${fmt(record.inputTokens)}, out ${fmt(record.outputTokens)}, ` +
        `cacheRead ${fmt(record.cachedInputTokens ?? record.cacheReadTokens)}, ` +
        `cacheWrite ${fmt(record.cacheWriteInputTokens ?? record.cacheCreationTokens)})`,
    )
  } catch (e) {
    // Best effort: leave the warning on the run document when we know the run.
    try {
      const run = args.run
      if (run) {
        const file = usagePath(run)
        const doc = loadUsage(file, { run, provider: args.provider ?? 'claude' })
        addWarning(doc, `collect ${args.role ?? '?'}-r${args.round ?? '?'}: ${e.message}`)
        saveUsage(file, doc)
      } else {
        warn(e.message)
      }
    } catch {
      warn(e.message)
    }
    warn('usage not recorded; this does not affect the verification gate')
    process.exit(strict ? 1 : 0)
  }
}

main()
