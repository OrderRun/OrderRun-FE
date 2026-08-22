#!/usr/bin/env node
// Provider-aware Harness usage reporter. All totals are derived at print time.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fmt, parseArgs } from './store.mjs'
import { historyReport } from './history-report.mjs'

const FIELDS = ['inputTokens', 'cachedInputTokens', 'cacheWriteInputTokens', 'outputTokens', 'reasoningOutputTokens', 'processedTokens']
const zero = () => Object.fromEntries(FIELDS.map((field) => [field, 0]))
const value = (record, field) => {
  if (field === 'cachedInputTokens') return record[field] ?? record.cacheReadTokens ?? 0
  if (field === 'cacheWriteInputTokens') return record[field] ?? record.cacheCreationTokens ?? 0
  if (field === 'reasoningOutputTokens') return record[field] ?? 0
  if (field === 'processedTokens') return record[field] ?? record.totalTokens ??
    (record.inputTokens ?? 0) + (record.outputTokens ?? 0) +
      (record.cacheReadTokens ?? 0) + (record.cacheCreationTokens ?? 0)
  return record[field] ?? 0
}
const add = (target, record) => {
  for (const field of FIELDS) target[field] += value(record, field)
  return target
}
const pad = (text, width, left = false) => left ? String(text).padStart(width) : String(text).padEnd(width)
function latestRun(workspace) {
  if (!existsSync(workspace)) return null
  return readdirSync(workspace).map((dir) => path.join(workspace, dir, 'usage.json'))
    .filter((file) => existsSync(file)).map((file) => ({ file, mtime: statSync(file).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0]?.file
}
function printDetail(records) {
  const columns = ['fresh input', 'cached input', 'cache write', 'output', 'reasoning', 'processed']
  const widths = columns.map((column) => Math.max(column.length, 11))
  console.log(pad('', 22) + columns.map((column, index) => `  ${pad(column, widths[index], true)}`).join(''))
  for (const record of records) {
    console.log(pad(record.invocationId, 22) + FIELDS.map(
      (field, index) => `  ${pad(fmt(value(record, field)), widths[index], true)}`,
    ).join(''))
  }
}
function printProvider(provider, records, detail) {
  console.log(`\n${provider.toUpperCase()}`)
  if (detail) printDetail(records)
  const agents = records.filter((record) => record.role !== 'orchestrator')
  const orchestrators = records.filter((record) => record.role === 'orchestrator')
  if (!detail) {
    // Output / Cache Read / Processed Share. Share is a share of raw tokens
    // processed in this run, never a cost or plan-usage share. The orchestrator
    // row is a run-boundary delta, so every row here covers the same scope.
    const overall = records.reduce(add, zero()).processedTokens
    const share = (n) => (overall ? `${((n / overall) * 100).toFixed(1)}%` : '—')
    const row = (label, totals) =>
      console.log(
        pad(label, 22) +
          pad(fmt(totals.outputTokens), 14, true) +
          pad(fmt(totals.cachedInputTokens), 16, true) +
          pad(share(totals.processedTokens), 18, true),
      )
    console.log(pad('Role', 22) + pad('Output', 14, true) + pad('Cache Read', 16, true) + pad('Processed Share', 18, true))
    for (const role of ['planner', 'implementer', 'reviewer', 'orchestrator']) {
      const selected = records.filter((record) => record.role === role)
      if (selected.length) row(role, selected.reduce(add, zero()))
    }
  }
  console.log(`${pad('Agent subtotal', 22)}${pad(fmt(agents.reduce(add, zero()).processedTokens), 14, true)}`)
  console.log(`${pad('Orchestrator', 22)}${pad(fmt(orchestrators.reduce(add, zero()).processedTokens), 14, true)}`)
  console.log(`${pad('Overall', 22)}${pad(fmt(records.reduce(add, zero()).processedTokens), 14, true)}`)
}

const args = parseArgs(process.argv.slice(2), ['detail', 'json', 'history'])

// --days / --history read the long-term JSONL history; the default view stays
// the single-run document, unchanged.
if (args.history || args.days) {
  await historyReport(args)
  process.exit(0)
}

const workspace = path.join(process.cwd(), '_workspace')
const file = args.run ? path.join(workspace, args.run, 'usage.json') : latestRun(workspace)
if (!file || !existsSync(file)) {
  console.error(args.run ? `[usage] no usage.json for run "${args.run}"` : '[usage] no usage data')
  process.exit(1)
}
let doc
try { doc = JSON.parse(readFileSync(file, 'utf8')) } catch (error) {
  console.error(`[usage] cannot read ${file}: ${error.message}`)
  process.exit(1)
}
if (args.json) { console.log(JSON.stringify(doc, null, 2)); process.exit(0) }
const all = Array.isArray(doc.agents) ? doc.agents : []
if (!all.length) { console.error(`[usage] ${file} contains no invocations`); process.exit(1) }

// Only old Claude whole-session orchestrator records are incomparable. Codex
// orchestrator exec transcripts and Claude run_delta records stay in the table.
const legacy = all.filter((record) =>
  (record.provider ?? doc.provider) === 'claude' && record.role === 'orchestrator' &&
  (record.measurementMode ?? 'session_cumulative') === 'session_cumulative')
const records = all.filter((record) => !legacy.includes(record))
const providers = new Map()
for (const record of records) {
  const provider = record.provider ?? doc.provider ?? 'unknown'
  if (!providers.has(provider)) providers.set(provider, [])
  providers.get(provider).push(record)
}
console.log(`\nHarness Usage — ${doc.run ?? '(unnamed run)'}`)
for (const [provider, selected] of providers) printProvider(provider, selected, args.detail)
console.log(`\nALL PROVIDERS`)
console.log(`${pad('Agent subtotal', 22)}${pad(fmt(records.filter((r) => r.role !== 'orchestrator').reduce(add, zero()).processedTokens), 14, true)}`)
console.log(`${pad('Orchestrator', 22)}${pad(fmt(records.filter((r) => r.role === 'orchestrator').reduce(add, zero()).processedTokens), 14, true)}`)
console.log(`${pad('Overall', 22)}${pad(fmt(records.reduce(add, zero()).processedTokens), 14, true)}`)
if (doc.runBoundary?.baseline) {
  const state = doc.runBoundary.endedAt ? `closed ${doc.runBoundary.endedAt}` : 'OPEN'
  console.log(`\nClaude run boundary: ${doc.runBoundary.startedAt} → ${state}`)
}
for (const record of legacy) console.log(`\nlegacy ${record.invocationId} session cumulative excluded`)
for (const warning of doc.warnings ?? []) console.log(`\nmonitoring warning: ${warning.message}`)
console.log(`\nprocessedTokens = fresh input + cached input + cache write + output.\n` +
  `processedTokens != billing / plan usage; provider raw tokens are not a cost comparison.\n` +
  `Reasoning output is preserved separately and is not added twice.\n` +
  `source: ${path.relative(process.cwd(), file)}  ·  --detail for field breakdown\n`)
