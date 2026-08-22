// Shared, provider-agnostic usage record for the long-lived history.
//
// The per-run document (_workspace/{slug}/usage.json) keeps its own richer,
// provider-shaped fields. This module is the *narrow* contract that every
// provider must be able to fill and that the history / report / snapshot layers
// are allowed to read. Nothing here may name a provider transcript field.
//
// A value a provider does not report is null (unknown) — never a guessed
// number. Token counters are the exception: a provider that reports a
// dimension as genuinely absent records 0 (e.g. Claude reports no reasoning
// split, so reasoningTokens is 0, not null).

export const HISTORY_SCHEMA_VERSION = 1

export const ROLES = ['planner', 'implementer', 'reviewer', 'orchestrator', 'unknown']
export const LANES = ['A', 'B', 'C', null]
// Architecture layer the run actually touched. `multi` means two or more.
export const LAYERS = ['presentation', 'domain', 'data', 'multi', 'unknown']

export const TOKEN_FIELDS = [
  'inputTokens',
  'outputTokens',
  'cacheReadTokens',
  'cacheWriteTokens',
  'reasoningTokens',
  'processedTokens',
]

export const COMMON_FIELDS = [
  'timestamp',
  'provider',
  'harnessVersion',
  'runId',
  'role',
  'lane',
  'layer',
  'round',
  'model',
  'status',
  'durationMs',
  ...TOKEN_FIELDS,
]

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const nullable = (v) => (v === undefined || v === '' ? null : v)

/**
 * How trustworthy a record's role/run attribution is. A harness-attributed
 * record (the orchestrator told the collector the role and round) always wins
 * over one the monitor auto-detected, so the reader can reconcile the two
 * without rewriting the append-only history.
 */
export const ATTRIBUTION_RANK = { harness: 2, auto: 1 }

/**
 * Identity of one measured invocation, stable across both ingest paths.
 * Auto-detected and harness-collected views of the same invocation collapse
 * onto one key, which is what makes re-ingestion idempotent.
 */
export function recordKey(record) {
  return `${record.provider}|${record.sourceId ?? `${record.runId}:${record.role}:${record.round}`}`
}

/**
 * Normalize any provider record into the shared history shape.
 *
 * `raw` is a provider adapter record (or a _workspace usage.json agent entry);
 * `context` carries the harness-side facts the provider cannot know.
 */
export function toHistoryRecord(raw, context = {}) {
  const inputTokens = num(raw.inputTokens)
  const outputTokens = num(raw.outputTokens)
  const cacheReadTokens = num(raw.cachedInputTokens ?? raw.cacheReadTokens)
  const cacheWriteTokens = num(raw.cacheWriteInputTokens ?? raw.cacheCreationTokens)
  const reasoningTokens = num(raw.reasoningOutputTokens ?? raw.reasoningTokens)

  // processedTokens is a raw throughput counter, never a cost:
  // fresh input + output + cache read + cache write. Reasoning output is a
  // subset the provider reports separately and is deliberately not re-added.
  const processedTokens =
    typeof raw.processedTokens === 'number' && Number.isFinite(raw.processedTokens)
      ? raw.processedTokens
      : inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens

  const role = ROLES.includes(raw.role) ? raw.role : 'unknown'
  const lane = context.lane && ['A', 'B', 'C'].includes(context.lane) ? context.lane : null

  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    timestamp: raw.finishedAt ?? raw.collectedAt ?? context.timestamp ?? new Date().toISOString(),
    provider: raw.provider ?? context.provider ?? 'unknown',
    harnessVersion: nullable(context.harnessVersion) ?? null,
    runId: nullable(context.runId) ?? null,
    role,
    lane,
    laneSource: lane ? (context.laneSource ?? 'declared') : null,
    // The layer the Harness already selected for this run. Never inferred from
    // transcript content; unresolved stays 'unknown'.
    layer: LAYERS.includes(context.layer) ? context.layer : 'unknown',
    round: Number.isInteger(raw.round) && raw.round > 0 ? raw.round : 1,
    model: nullable(raw.model) ?? null,
    status: raw.status ?? context.status ?? 'unknown',
    durationMs: Number.isFinite(raw.durationMs) ? raw.durationMs : null,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    reasoningTokens,
    processedTokens,
    measurementMode: raw.measurementMode ?? context.measurementMode ?? 'invocation',
    attribution: context.attribution ?? 'harness',
    // Local-debug identifier only. snapshot.mjs strips it before anything
    // reaches the portfolio directory.
    sourceId: nullable(raw.sourceId) ?? null,
    quality: context.quality ?? null,
  }
}
