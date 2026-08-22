// Harness-side facts about a run, read from files the Harness already writes.
//
// Nothing here asks an agent anything. Every value is either read from a file
// or left null. A pattern that does not match is null, never a guess — a wrong
// quality number would be worse than a missing one.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

export function harnessVersion(root = process.cwd()) {
  const file = path.join(root, '.harness', 'VERSION')
  if (!existsSync(file)) return null
  const value = readFileSync(file, 'utf8').trim()
  return /^\d+\.\d+\.\d+$/.test(value) ? value : null
}

function reviewFiles(runDir) {
  if (!existsSync(runDir)) return []
  return readdirSync(runDir)
    .filter((f) => /^review_r(\d+)\.md$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map((f) => path.join(runDir, f))
}

// The reviewer artifact opens with a header line naming the Lane and a "Gates:"
// line with one exit code per gate, followed by a verdict. Only these three
// shapes are read; the prose body is never parsed and never inspected further.
const LANE_RE = /Lane\s+([ABC])\b/
const VERDICT_RE = /\b(FIX_REQUIRED|PASS)\b/
const gateRe = (name) => new RegExp(`${name}[^0-9\\n]{0,12}(\\d+)`, 'i')

function head(file, lines = 8) {
  try {
    return readFileSync(file, 'utf8').split('\n').slice(0, lines).join('\n')
  } catch {
    return ''
  }
}

function gate(text, name) {
  const m = text.match(gateRe(name))
  if (!m) return null
  return Number(m[1]) === 0
}

/**
 * Lane, verification outcome and revision count for one run slug.
 * Every field is independently nullable.
 */
export function runMeta(runSlug, root = process.cwd()) {
  const runDir = path.join(root, '_workspace', runSlug)
  const meta = {
    lane: null,
    laneSource: null,
    quality: {
      reviewerFirstPass: null,
      revisionRounds: null,
      typecheckPassed: null,
      lintPassed: null,
      buildPassed: null,
      testPassed: null,
    },
  }
  if (!existsSync(runDir)) return meta

  // A declared lane in the run document beats anything inferred from artifacts.
  const usageFile = path.join(runDir, 'usage.json')
  if (existsSync(usageFile)) {
    try {
      const doc = JSON.parse(readFileSync(usageFile, 'utf8'))
      if (['A', 'B', 'C'].includes(doc.lane)) {
        meta.lane = doc.lane
        meta.laneSource = 'declared'
      }
    } catch {
      /* handled by the caller's warning path */
    }
  }

  const reviews = reviewFiles(runDir)
  if (reviews.length) {
    const first = head(reviews[0])
    const last = head(reviews[reviews.length - 1])

    if (!meta.lane) {
      const m = first.match(LANE_RE)
      if (m) {
        meta.lane = m[1]
        meta.laneSource = 'artifact'
      }
    }
    const firstVerdict = first.match(VERDICT_RE)
    if (firstVerdict) meta.quality.reviewerFirstPass = firstVerdict[1] === 'PASS'
    meta.quality.revisionRounds = reviews.length - 1

    // Gates are read from the final review only: that is the state the run
    // ended in. Earlier rounds' failures are represented by revisionRounds.
    meta.quality.typecheckPassed = gate(last, 'typecheck')
    meta.quality.lintPassed = gate(last, 'lint')
    meta.quality.buildPassed = gate(last, 'build')
    meta.quality.testPassed = gate(last, 'test')
  }

  // Lane A runs no planner, so the absence of plan.md is real evidence — but it
  // is weaker than a declaration, and B/C cannot be told apart this way, so
  // only the A case is inferred and it is labelled as inferred.
  if (!meta.lane && reviews.length && !existsSync(path.join(runDir, 'plan.md'))) {
    meta.lane = 'A'
    meta.laneSource = 'inferred'
  }
  return meta
}
