// Observability-layer tests. Everything runs against synthetic fixtures in a
// temp directory or against files already on disk. No agent is spawned and no
// network call is made: running this suite costs 0 AI calls.

import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, appendFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'
import { toHistoryRecord, recordKey } from './lib/schema.mjs'
import { appendRecords, readHistory, historyPath } from './lib/history.mjs'
import { runMeta, harnessVersion } from './lib/runmeta.mjs'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const MONITOR = path.join(HERE, 'monitor.mjs')
const SNAPSHOT = path.join(HERE, 'snapshot.mjs')
const REPORT = path.join(HERE, 'report.mjs')

function sandbox() {
  const root = mkdtempSync(path.join(tmpdir(), 'harness-usage-'))
  mkdirSync(path.join(root, '.harness'), { recursive: true })
  writeFileSync(path.join(root, '.harness', 'VERSION'), '1.2.0\n')
  return root
}

function runDoc(root, slug, doc, { review = null } = {}) {
  const dir = path.join(root, '_workspace', slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'usage.json'), JSON.stringify(doc, null, 2))
  if (review) writeFileSync(path.join(dir, 'review_r1.md'), review)
  return dir
}

const sampleDoc = (run) => ({
  run,
  provider: 'claude',
  lane: 'B',
  agents: [
    {
      provider: 'claude',
      invocationId: 'planner-r1',
      role: 'planner',
      round: 1,
      model: 'claude-opus-5',
      inputTokens: 100,
      cachedInputTokens: 900,
      cacheWriteInputTokens: 20,
      outputTokens: 80,
      reasoningOutputTokens: 0,
      processedTokens: 1100,
      sourceId: `agent-plan-${run}`,
      transcriptPath: '~/.claude/projects/x/agent-plan-1.jsonl',
    },
    {
      provider: 'codex',
      invocationId: 'implementer-r1',
      role: 'implementer',
      round: 1,
      inputTokens: 150,
      cachedInputTokens: 1200,
      cacheWriteInputTokens: 0,
      outputTokens: 120,
      reasoningOutputTokens: 35,
      processedTokens: 1470,
      sourceId: `codex-thread-${run}`,
    },
  ],
})

// stdout + stderr together: monitoring warnings go to stderr by design.
function node(script, args, root) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, `${path.basename(script)} exited ${result.status}: ${result.stderr}`)
  return `${result.stdout}${result.stderr}`
}

test('shared schema normalizes both providers into the same fields', () => {
  const claude = toHistoryRecord(
    { provider: 'claude', role: 'planner', round: 1, inputTokens: 10, outputTokens: 5, cacheReadTokens: 7, cacheCreationTokens: 3 },
    { runId: 'r', harnessVersion: '1.0.0', lane: 'B' },
  )
  const codex = toHistoryRecord(
    { provider: 'codex', role: 'planner', round: 1, inputTokens: 10, outputTokens: 5, cachedInputTokens: 7, cacheWriteInputTokens: 3, reasoningOutputTokens: 4 },
    { runId: 'r', harnessVersion: '1.0.0', lane: 'B' },
  )
  assert.deepEqual(Object.keys(claude), Object.keys(codex))
  for (const f of ['inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'processedTokens']) {
    assert.equal(claude[f], codex[f], f)
  }
  // processedTokens is input + output + cacheRead + cacheWrite; reasoning is
  // preserved separately and never added twice.
  assert.equal(claude.processedTokens, 25)
  assert.equal(claude.reasoningTokens, 0)
  assert.equal(codex.reasoningTokens, 4)
  assert.equal(codex.processedTokens, 25)
})

test('an unknown role is recorded as unknown, never guessed', () => {
  const record = toHistoryRecord({ provider: 'codex', role: 'guardian' }, {})
  assert.equal(record.role, 'unknown')
  assert.equal(record.lane, null)
  assert.equal(record.harnessVersion, null)
})

test('history append is incremental and reconciles on read', async () => {
  const root = sandbox()
  const auto = toHistoryRecord({ provider: 'claude', role: 'reviewer', sourceId: 'a1', outputTokens: 5 }, { attribution: 'auto' })
  appendRecords([auto], root)
  const harness = toHistoryRecord(
    { provider: 'claude', role: 'reviewer', round: 2, sourceId: 'a1', outputTokens: 5 },
    { attribution: 'harness', runId: 'run-x', lane: 'C' },
  )
  appendRecords([harness], root)

  assert.equal(readFileSync(historyPath(root), 'utf8').trim().split('\n').length, 2, 'appends, never rewrites')
  const { records } = await readHistory({ root })
  assert.equal(records.length, 1, 'same invocation collapses to one')
  assert.equal(records[0].attribution, 'harness', 'harness attribution wins')
  assert.equal(records[0].runId, 'run-x')
  assert.equal(recordKey(auto), recordKey(harness))
  rmSync(root, { recursive: true, force: true })
})

test('malformed history lines are skipped, not fatal', async () => {
  const root = sandbox()
  appendRecords([toHistoryRecord({ provider: 'claude', role: 'planner', sourceId: 'ok' }, {})], root)
  appendFileSync(historyPath(root), 'not json\n{"broken":\n{"no":"provider"}\n')
  const { records, malformed } = await readHistory({ root })
  assert.equal(records.length, 1)
  assert.equal(malformed, 3)
  rmSync(root, { recursive: true, force: true })
})

test('monitor ingests run documents incrementally and is restart-safe', async () => {
  const root = sandbox()
  runDoc(root, 'run-one', sampleDoc('run-one'), {
    review: '# review_r1 (Lane B)\n\nGates: typecheck 0 / lint 0 / build 0.\n판정: PASS\n',
  })

  node(MONITOR, ['--once', '--quiet', '0'], root)
  let history = await readHistory({ root })
  assert.equal(history.records.length, 2)
  const planner = history.records.find((r) => r.role === 'planner')
  assert.equal(planner.provider, 'claude')
  assert.equal(planner.runId, 'run-one')
  assert.equal(planner.lane, 'B')
  assert.equal(planner.harnessVersion, '1.2.0')
  assert.equal(planner.quality.reviewerFirstPass, true)
  assert.equal(planner.quality.revisionRounds, 0)
  assert.equal(planner.quality.typecheckPassed, true)
  assert.equal(planner.quality.testPassed, null, 'an unreadable gate stays null')
  assert.equal(history.records.find((r) => r.role === 'implementer').provider, 'codex')

  // Second pass: nothing changed.
  node(MONITOR, ['--once', '--quiet', '0'], root)
  assert.equal(readFileSync(historyPath(root), 'utf8').trim().split('\n').length, 2)

  // Restart with the cursor lost: still no duplicates.
  rmSync(path.join(root, '.harness', 'metrics', 'raw', 'monitor-state.json'))
  node(MONITOR, ['--once', '--quiet', '0'], root)
  history = await readHistory({ root })
  assert.equal(history.records.length, 2)

  // A new run is picked up on the next pass.
  runDoc(root, 'run-two', sampleDoc('run-two'))
  node(MONITOR, ['--once', '--quiet', '0'], root)
  history = await readHistory({ root })
  assert.equal(history.records.length, 4)
  assert.equal(new Set(history.records.map((r) => r.runId)).size, 2)
  rmSync(root, { recursive: true, force: true })
})

test('monitor survives a malformed run document without failing', () => {
  const root = sandbox()
  const dir = path.join(root, '_workspace', 'broken')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'usage.json'), '{ not json')
  runDoc(root, 'run-ok', sampleDoc('run-ok'))
  const out = node(MONITOR, ['--once', '--quiet', '0'], root)
  assert.match(out, /warning/, 'the failure is reported as a warning')
  assert.match(out, /run-ok/, 'the healthy run is still recorded')
  rmSync(root, { recursive: true, force: true })
})

test('orchestrator run_delta is preserved, never a session cumulative', async () => {
  const root = sandbox()
  const doc = sampleDoc('run-delta')
  doc.agents.push({
    provider: 'claude',
    invocationId: 'orchestrator-r1',
    role: 'orchestrator',
    round: 1,
    measurementMode: 'run_delta',
    inputTokens: 200,
    cacheReadTokens: 3000,
    cacheCreationTokens: 0,
    outputTokens: 100,
    processedTokens: 3300,
    sourceId: 'session-1#run',
  })
  runDoc(root, 'run-delta', doc)
  node(MONITOR, ['--once', '--quiet', '0'], root)
  const { records } = await readHistory({ root })
  const orchestrator = records.find((r) => r.role === 'orchestrator')
  assert.equal(orchestrator.measurementMode, 'run_delta')
  assert.equal(orchestrator.processedTokens, 3300)
  rmSync(root, { recursive: true, force: true })
})

test('period report aggregates by provider, role, lane and harness version', () => {
  const root = sandbox()
  runDoc(root, 'run-one', sampleDoc('run-one'))
  node(MONITOR, ['--once', '--quiet', '0'], root)
  const out = node(REPORT, ['--days', '7'], root)
  for (const section of ['BY PROVIDER', 'BY ROLE', 'BY LANE', 'BY HARNESS VERSION', 'PER RUN']) {
    assert.match(out, new RegExp(section))
  }
  assert.match(out, /1\.2\.0/)
  assert.match(out, /!= billing cost/)
  // An older-than-window record is excluded.
  const old = toHistoryRecord({ provider: 'claude', role: 'planner', sourceId: 'ancient', outputTokens: 999999 }, {})
  old.timestamp = '2000-01-01T00:00:00.000Z'
  appendRecords([old], root)
  assert.doesNotMatch(node(REPORT, ['--days', '7'], root), /999,999/)
  assert.match(node(REPORT, ['--history'], root), /999,999|ancient|BY ROLE/)
  rmSync(root, { recursive: true, force: true })
})

test('portfolio snapshot aggregates and strips every runtime identifier', () => {
  const root = sandbox()
  runDoc(root, 'run-one', sampleDoc('run-one'), {
    review: '# review_r1 (Lane B)\n\nGates: typecheck 0 / lint 0 / build 0.\n판정: PASS\n',
  })
  node(MONITOR, ['--once', '--quiet', '0'], root)
  node(SNAPSHOT, [], root)

  const dir = path.join(root, 'docs', 'engineering', 'harness-metrics')
  const csv = readFileSync(path.join(dir, 'history.csv'), 'utf8')
  const summary = readFileSync(path.join(dir, 'summary.json'), 'utf8')

  assert.match(csv.split('\n')[0], /^date,harnessVersion,provider,lane,role,runCount/)
  assert.match(csv, /1\.2\.0/)
  for (const leak of ['agent-plan-run-one', 'codex-thread-run-one', 'run-one', '.claude/projects', 'sourceId', 'sessionId', 'transcriptPath']) {
    assert.ok(!csv.includes(leak), `csv leaks ${leak}`)
    assert.ok(!summary.includes(leak), `summary leaks ${leak}`)
  }
  const parsed = JSON.parse(summary)
  assert.equal(parsed.byHarnessVersion['1.2.0'].runs, 1)
  assert.match(parsed.definitions.caveat, /!= billing cost/)
  // One version only: no change percentage is invented.
  assert.deepEqual(parsed.versionComparison, [])
  rmSync(root, { recursive: true, force: true })
})

test('a version change is only reported with enough runs behind it', () => {
  const root = sandbox()
  const records = []
  for (const [version, runs] of [['1.0.0', 4], ['1.1.0', 4]]) {
    for (let i = 0; i < runs; i++) {
      records.push(
        toHistoryRecord(
          { provider: 'claude', role: 'implementer', sourceId: `${version}-${i}`, outputTokens: 100, inputTokens: version === '1.0.0' ? 1000 : 500 },
          { runId: `${version}-run-${i}`, harnessVersion: version, lane: 'B' },
        ),
      )
    }
  }
  appendRecords(records, root)
  node(SNAPSHOT, [], root)
  const summary = JSON.parse(readFileSync(path.join(root, 'docs/engineering/harness-metrics/summary.json'), 'utf8'))
  const change = summary.versionComparison[0]
  assert.equal(change.sufficientData, true)
  assert.equal(change.processedTokensPerRunChangePct, -45.5)

  // With a single run per version the change stays null and says why.
  const small = sandbox()
  appendRecords(
    [
      toHistoryRecord({ provider: 'claude', role: 'planner', sourceId: 'a' }, { runId: 'r1', harnessVersion: '1.0.0' }),
      toHistoryRecord({ provider: 'claude', role: 'planner', sourceId: 'b' }, { runId: 'r2', harnessVersion: '1.1.0' }),
    ],
    small,
  )
  node(SNAPSHOT, [], small)
  const tiny = JSON.parse(readFileSync(path.join(small, 'docs/engineering/harness-metrics/summary.json'), 'utf8'))
  assert.equal(tiny.versionComparison[0].sufficientData, false)
  assert.equal(tiny.versionComparison[0].processedTokensPerRunChangePct, null)
  assert.match(tiny.versionComparison[0].note, /sample too small/)
  rmSync(root, { recursive: true, force: true })
  rmSync(small, { recursive: true, force: true })
})

test('run metadata is read from harness artifacts, and stays null when unreadable', () => {
  const root = sandbox()
  runDoc(root, 'no-review', { run: 'no-review', agents: [] })
  const bare = runMeta('no-review', root)
  assert.equal(bare.lane, null)
  assert.equal(bare.quality.reviewerFirstPass, null)
  assert.equal(bare.quality.revisionRounds, null)

  const dir = runDoc(root, 'lane-a', { run: 'lane-a', agents: [] }, {
    review: '# review_r1 (Lane A)\n\nGates: typecheck 0 / lint 1 / build 0.\n판정: FIX_REQUIRED\n',
  })
  writeFileSync(path.join(dir, 'review_r2.md'), '# review_r2\n\nGates: typecheck 0 / lint 0 / build 0.\n판정: PASS\n')
  const meta = runMeta('lane-a', root)
  assert.equal(meta.lane, 'A')
  assert.equal(meta.laneSource, 'artifact')
  assert.equal(meta.quality.reviewerFirstPass, false)
  assert.equal(meta.quality.revisionRounds, 1)
  assert.equal(meta.quality.lintPassed, true, 'gates come from the final round')
  assert.equal(harnessVersion(root), '1.2.0')
  assert.ok(existsSync(path.join(root, '.harness', 'VERSION')))
  rmSync(root, { recursive: true, force: true })
})
