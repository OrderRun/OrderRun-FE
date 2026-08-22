import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { scanCodexTranscript } from './codex.mjs'

const usage = (overrides = {}) => ({
  input_tokens: 100,
  cached_input_tokens: 60,
  cache_write_input_tokens: 10,
  output_tokens: 20,
  reasoning_output_tokens: 7,
  total_tokens: 120,
  ...overrides,
})
async function transcript(lines) {
  const dir = await mkdtemp(path.join(tmpdir(), 'codex-usage-'))
  const file = path.join(dir, 'invocation.jsonl')
  await writeFile(file, `${lines.join('\n')}\n`)
  return file
}

test('parses turn.completed usage and preserves cache write/reasoning', async () => {
  const file = await transcript([
    JSON.stringify({ type: 'thread.started', thread_id: 'thread-1' }),
    JSON.stringify({ type: 'turn.completed', usage: usage() }),
  ])
  const result = await scanCodexTranscript(file)
  assert.equal(result.usageSource, 'turn.completed.usage')
  assert.deepEqual(result.totals, {
    inputTokens: 30,
    cachedInputTokens: 60,
    cacheWriteInputTokens: 10,
    outputTokens: 20,
    reasoningOutputTokens: 7,
    processedTokens: 120,
  })
})

test('uses last_token_usage fallback without summing cumulative total_token_usage', async () => {
  const file = await transcript([
    JSON.stringify({ type: 'event_msg', payload: { type: 'token_count', info: {
      last_token_usage: usage({ input_tokens: 10, cached_input_tokens: 0, cache_write_input_tokens: 0, output_tokens: 2 }),
      total_token_usage: usage({ input_tokens: 1000, output_tokens: 1000 }),
    } } }),
    JSON.stringify({ type: 'event_msg', payload: { type: 'token_count', info: {
      last_token_usage: usage({ input_tokens: 20, cached_input_tokens: 5, cache_write_input_tokens: 0, output_tokens: 3 }),
      total_token_usage: usage({ input_tokens: 2000, output_tokens: 2000 }),
    } } }),
  ])
  const result = await scanCodexTranscript(file)
  assert.equal(result.usageSource, 'token_count.last_token_usage')
  assert.equal(result.totals.processedTokens, 35)
  assert.equal(result.totals.inputTokens, 25)
})

test('turn.completed prevents fallback double counting and malformed JSON is ignored', async () => {
  const file = await transcript([
    '{broken',
    JSON.stringify({ type: 'event_msg', payload: { type: 'token_count', info: { last_token_usage: usage({ input_tokens: 999 }) } } }),
    JSON.stringify({ type: 'turn.completed', usage: usage() }),
  ])
  const result = await scanCodexTranscript(file)
  assert.equal(result.totals.processedTokens, 120)
  assert.equal(result.malformed, 1)
})

test('collector is idempotent, rejects one source for another invocation, and failure is non-fatal', async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'codex-collector-'))
  const file = path.join(cwd, 'same.jsonl')
  await writeFile(file, `${JSON.stringify({ type: 'thread.started', thread_id: 'same-source' })}\n${JSON.stringify({ type: 'turn.completed', usage: usage() })}\n`)
  const collect = (...args) => spawnSync(process.execPath, [
    path.resolve('scripts/harness-usage/collect.mjs'), '--provider', 'codex', '--run', 'test', ...args,
  ], { cwd, encoding: 'utf8' })

  const first = collect('--role', 'planner', '--round', '1', '--transcript', file)
  assert.equal(first.status, 0)
  assert.equal(first.stderr, '')
  const repeated = collect('--role', 'planner', '--round', '1', '--transcript', file)
  assert.equal(repeated.status, 0)
  assert.equal(repeated.stderr, '')
  let doc = JSON.parse(await readFile(path.join(cwd, '_workspace/test/usage.json'), 'utf8'))
  assert.equal(doc.agents.length, 1)

  const duplicate = collect('--role', 'reviewer', '--round', '1', '--transcript', file)
  assert.equal(duplicate.status, 0)
  assert.match(duplicate.stderr, /refusing to double-count/)
  doc = JSON.parse(await readFile(path.join(cwd, '_workspace/test/usage.json'), 'utf8'))
  assert.equal(doc.agents.length, 1)

  const missing = collect('--role', 'implementer', '--round', '1', '--transcript', 'missing.jsonl')
  assert.equal(missing.status, 0)
  assert.match(missing.stderr, /does not affect the verification gate/)
})

test('report groups Claude and Codex and separates agents from orchestrator', async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'usage-report-'))
  const runDir = path.join(cwd, '_workspace', 'mixed')
  await import('node:fs/promises').then(({ mkdir }) => mkdir(runDir, { recursive: true }))
  const base = { inputTokens: 10, cachedInputTokens: 20, cacheWriteInputTokens: 0,
    outputTokens: 5, reasoningOutputTokens: 1, processedTokens: 35 }
  await writeFile(path.join(runDir, 'usage.json'), JSON.stringify({ run: 'mixed', agents: [
    { ...base, provider: 'claude', invocationId: 'planner-r1', role: 'planner', round: 1 },
    { ...base, provider: 'claude', invocationId: 'orchestrator-r1', role: 'orchestrator', round: 1 },
    { ...base, provider: 'codex', invocationId: 'implementer-r1', role: 'implementer', round: 1 },
    { ...base, provider: 'codex', invocationId: 'orchestrator-r1', role: 'orchestrator', round: 1 },
  ] }))
  const result = spawnSync(process.execPath, [path.resolve('scripts/harness-usage/report.mjs'),
    '--run', 'mixed', '--detail'], { cwd, encoding: 'utf8' })
  assert.equal(result.status, 0)
  assert.match(result.stdout, /CLAUDE[\s\S]*CODEX[\s\S]*ALL PROVIDERS/)
  assert.match(result.stdout, /fresh input[\s\S]*cached input[\s\S]*cache write/)
  assert.match(result.stdout, /Agent subtotal[\s\S]*Orchestrator[\s\S]*Overall/)
  assert.match(result.stdout, /processedTokens != billing \/ plan usage/)
})
