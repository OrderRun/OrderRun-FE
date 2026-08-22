// Shared helpers for the usage collector and the run-boundary lifecycle.
// Kept in one place so both entry points read and write usage.json identically.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const SCHEMA_VERSION = 2
export const ROLES = ['planner', 'implementer', 'reviewer', 'orchestrator']
export const FIELDS = [
  'inputTokens',
  'outputTokens',
  'cacheReadTokens',
  'cacheCreationTokens',
]

export function parseArgs(argv, flags = []) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) {
      out._.push(a)
      continue
    }
    const key = a.slice(2)
    if (flags.includes(key)) out[key] = true
    else out[key] = argv[++i]
  }
  return out
}

export function warn(msg) {
  console.warn(`[usage] warning: ${msg}`)
}

export function usagePath(runSlug, cwd = process.cwd()) {
  return path.join(cwd, '_workspace', runSlug, 'usage.json')
}

export function loadUsage(file, { run, provider }) {
  if (existsSync(file)) {
    try {
      const doc = JSON.parse(readFileSync(file, 'utf8'))
      if (Array.isArray(doc.agents)) return doc
      warn(`${file} has no agents array; starting a fresh document`)
    } catch (e) {
      warn(`${file} is unreadable (${e.message}); starting a fresh document`)
    }
  }
  return { run, provider, schemaVersion: SCHEMA_VERSION, agents: [] }
}

export function saveUsage(file, doc) {
  doc.schemaVersion = SCHEMA_VERSION
  doc.agents.sort(
    (a, b) =>
      String(a.provider ?? doc.provider).localeCompare(String(b.provider ?? doc.provider)) ||
      a.round - b.round ||
      a.role.localeCompare(b.role),
  )
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`)
}

/** Record a non-fatal monitoring warning inside the run document itself. */
export function addWarning(doc, message) {
  if (!Array.isArray(doc.warnings)) doc.warnings = []
  doc.warnings = doc.warnings.filter((w) => w.message !== message)
  doc.warnings.push({ at: new Date().toISOString(), message })
  warn(message)
}

export function fmt(v) {
  return Number(v ?? 0).toLocaleString('en-US')
}
