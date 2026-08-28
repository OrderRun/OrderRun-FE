/**
 * Pulls the live OpenAPI document from the API server into
 * docs/api-spec/openapi.json.
 *
 * Config is read from .env.development.local (gitignored), with process.env
 * taking precedence so CI can override:
 *
 *   VITE_API_BASE_URL   base URL of the API server (required)
 *   DOCS_BASIC_AUTH     "user:password" for the /docs Basic Auth gate (optional)
 *
 * The staging docs sit behind Basic Auth; without DOCS_BASIC_AUTH the request
 * comes back 401.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(root, 'docs/api-spec/openapi.json')

function readEnvFile(name) {
  try {
    const raw = readFileSync(resolve(root, name), 'utf8')
    const out = {}
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
      if (!match) continue
      out[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
    return out
  } catch {
    return {}
  }
}

const fileEnv = readEnvFile('.env.development.local')
const baseUrl = (process.env.VITE_API_BASE_URL ?? fileEnv.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const basicAuth = process.env.DOCS_BASIC_AUTH ?? fileEnv.DOCS_BASIC_AUTH ?? ''

if (!baseUrl) {
  console.error('api:sync — VITE_API_BASE_URL is not set (.env.development.local or env).')
  process.exit(1)
}

const headers = { Accept: 'application/json' }
if (basicAuth) {
  headers.Authorization = `Basic ${Buffer.from(basicAuth).toString('base64')}`
}

const url = `${baseUrl}/openapi.json`
const response = await fetch(url, { headers })

if (!response.ok) {
  const hint =
    response.status === 401
      ? ' — set DOCS_BASIC_AUTH="user:password" in .env.development.local'
      : ''
  console.error(`api:sync — GET ${url} failed: ${response.status} ${response.statusText}${hint}`)
  process.exit(1)
}

const body = await response.text()
writeFileSync(OUT, body.endsWith('\n') ? body : `${body}\n`)
console.log(`api:sync — wrote ${OUT} (${body.length} bytes) from ${url}`)
