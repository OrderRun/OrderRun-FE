// Grouping and averaging over the long-term history. Pure functions: nothing
// here reads or writes files, so report and snapshot cannot drift apart.

const TOKEN = ['inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens', 'processedTokens']

export function sinceISO(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

const emptyBucket = () => ({
  records: 0,
  runs: new Set(),
  ...Object.fromEntries(TOKEN.map((f) => [f, 0])),
  durationMs: 0,
  durationSamples: 0,
})

function add(bucket, record) {
  bucket.records++
  if (record.runId) bucket.runs.add(record.runId)
  for (const f of TOKEN) bucket[f] += Number(record[f] ?? 0)
  if (Number.isFinite(record.durationMs)) {
    bucket.durationMs += record.durationMs
    bucket.durationSamples++
  }
  return bucket
}

/** Group records by an arbitrary key function; returns a Map of buckets. */
export function groupBy(records, keyFn) {
  const out = new Map()
  for (const record of records) {
    const key = keyFn(record)
    if (key === null || key === undefined) continue
    if (!out.has(key)) out.set(key, emptyBucket())
    add(out.get(key), record)
  }
  return out
}

export const avg = (bucket, field) => (bucket.records ? bucket[field] / bucket.records : 0)
export const perRun = (bucket, field) => (bucket.runs.size ? bucket[field] / bucket.runs.size : 0)

/**
 * Per-run quality roll-up. Each run contributes at most one sample, so a run
 * with more invocations does not weigh more. A null stays out of the sample.
 */
export function qualityByRun(records) {
  const runs = new Map()
  for (const record of records) {
    if (!record.runId || !record.quality) continue
    if (!runs.has(record.runId)) runs.set(record.runId, { ...record.quality, lane: record.lane, harnessVersion: record.harnessVersion })
  }
  return runs
}

/**
 * Collapse invocations into one row per run: planner + implementer + reviewer +
 * orchestrator of the same runId are summed first. Records with no runId are
 * left out — they belong to no run and would distort a per-run average.
 */
export function runTotals(records) {
  const runs = new Map()
  for (const record of records) {
    if (!record.runId) continue
    if (!runs.has(record.runId)) {
      runs.set(record.runId, {
        runId: record.runId,
        harnessVersion: record.harnessVersion ?? 'unrecorded',
        layer: record.layer ?? 'unknown',
        lane: record.lane ?? 'unrecorded',
        quality: record.quality ?? null,
        ...Object.fromEntries(TOKEN.map((f) => [f, 0])),
      })
    }
    const run = runs.get(record.runId)
    for (const f of TOKEN) run[f] += Number(record[f] ?? 0)
    // A run's layer/lane/quality come from the run's own metadata; the first
    // record that carries one wins and the rest agree by construction.
    if (run.layer === 'unknown' && record.layer) run.layer = record.layer
    if (run.lane === 'unrecorded' && record.lane) run.lane = record.lane
    if (!run.quality && record.quality) run.quality = record.quality
  }
  return [...runs.values()]
}

export function rate(values) {
  const sample = values.filter((v) => v === true || v === false)
  if (!sample.length) return { rate: null, n: 0 }
  return { rate: sample.filter(Boolean).length / sample.length, n: sample.length }
}

export function mean(values) {
  const sample = values.filter((v) => typeof v === 'number' && Number.isFinite(v))
  if (!sample.length) return { mean: null, n: 0 }
  return { mean: sample.reduce((a, b) => a + b, 0) / sample.length, n: sample.length }
}
