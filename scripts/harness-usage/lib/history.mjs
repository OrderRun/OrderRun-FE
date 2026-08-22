// Append-only long-term usage history (JSONL) + monitor cursor state.
//
// One line per usage record. Appending never rewrites the file, so the cost of
// recording stays constant no matter how long the history grows. Readers do
// the reconciling instead: a record can be re-observed with better attribution
// later, and the reader keeps the best one.

import { appendFileSync, createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import path from 'node:path'
import { ATTRIBUTION_RANK, recordKey } from './schema.mjs'

export const METRICS_DIR = path.join('.harness', 'metrics', 'raw')
export const HISTORY_FILE = path.join(METRICS_DIR, 'usage-history.jsonl')
export const STATE_FILE = path.join(METRICS_DIR, 'monitor-state.json')

export function historyPath(root = process.cwd()) {
  return path.join(root, HISTORY_FILE)
}
export function statePath(root = process.cwd()) {
  return path.join(root, STATE_FILE)
}

export function appendRecords(records, root = process.cwd()) {
  if (!records.length) return 0
  const file = historyPath(root)
  mkdirSync(path.dirname(file), { recursive: true })
  appendFileSync(file, records.map((r) => JSON.stringify(r)).join('\n') + '\n')
  return records.length
}

/**
 * Read the history line by line. A malformed line is skipped and counted, never
 * fatal: one bad append must not make the whole history unreadable.
 *
 * With `dedupe` (default), records that describe the same invocation collapse
 * to one — the highest-ranked attribution wins, and within the same rank the
 * later line wins. This is how an auto-detected record is superseded by the
 * harness-attributed one without ever rewriting the file.
 */
export async function readHistory({ root = process.cwd(), dedupe = true, since = null } = {}) {
  const file = historyPath(root)
  if (!existsSync(file)) return { records: [], malformed: 0 }
  const byKey = new Map()
  const all = []
  let malformed = 0

  const rl = createInterface({
    input: createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.trim()) continue
    if (line.charCodeAt(0) !== 123) {
      malformed++
      continue
    }
    let record
    try {
      record = JSON.parse(line)
    } catch {
      malformed++
      continue
    }
    if (!record || typeof record !== 'object' || !record.provider || !record.role) {
      malformed++
      continue
    }
    if (since && String(record.timestamp ?? '') < since) continue
    if (!dedupe) {
      all.push(record)
      continue
    }
    const key = recordKey(record)
    const prev = byKey.get(key)
    if (!prev) byKey.set(key, record)
    else {
      const a = ATTRIBUTION_RANK[record.attribution] ?? 0
      const b = ATTRIBUTION_RANK[prev.attribution] ?? 0
      if (a >= b) byKey.set(key, record)
    }
  }
  return { records: dedupe ? [...byKey.values()] : all, malformed }
}

/** Keys already present in the history, so re-ingest never double-counts. */
export async function knownKeys(root = process.cwd()) {
  const { records } = await readHistory({ root, dedupe: false })
  return new Map(records.map((r) => [recordKey(r), ATTRIBUTION_RANK[r.attribution] ?? 0]))
}

export function loadState(root = process.cwd()) {
  const file = statePath(root)
  if (!existsSync(file)) return { version: 1, providers: {} }
  try {
    const state = JSON.parse(readFileSync(file, 'utf8'))
    return state && typeof state === 'object' ? { version: 1, providers: {}, ...state } : { version: 1, providers: {} }
  } catch {
    // A corrupt cursor file must not stop monitoring; it only costs one rescan,
    // and the history keys still prevent duplicates.
    return { version: 1, providers: {} }
  }
}

export function saveState(state, root = process.cwd()) {
  const file = statePath(root)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`)
}
