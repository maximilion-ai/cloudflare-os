#!/usr/bin/env node
// Garten vocabulary gate. Scans user-facing strings in src/**/*.tsx for Cloudflare OS nouns that
// the product renames and fails when any remain. Run: node scripts/vocab-check.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// CF-OS noun -> Garten noun. The single source of truth for product vocabulary.
export const VOCABULARY = {
  workspace: 'space',
  workspaces: 'spaces',
  blueprint: 'template',
  blueprints: 'templates',
  gatekeeper: 'connection',
  gatekeepers: 'connections',
  output: 'item',
  outputs: 'library',
  gadget: 'app',
  gadgets: 'apps',
  workpiece: 'item',
  workpieces: 'items',
  'cloudflare os': 'garten',
}

const BANNED = new RegExp(`\\b(${Object.keys(VOCABULARY).join('|')})\\b`, 'i')
const ATTRS = 'title|label|placeholder|aria-label|description|heading|content|subtitle|hint|tooltip|emptyTitle|emptyDescription'
const KEYS = 'label|title|description|heading|subtitle|placeholder|text|name'
const PATTERNS = [
  // JSX text nodes: text right after a tag, or after an {expression} and before a tag
  /<\/?[A-Za-z][^<>]*>\s*([^<>{}]+?)\s*(?=[<{])/gs,
  /\}\s*([^<>{}]+?)\s*(?=<)/gs,
  // quoted JSX expressions: {'text'} / {"text"} / {`text`}
  /\{\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1\s*\}/g,
  // user-facing attributes and object keys with a string value
  new RegExp(`\\b(?:${ATTRS}|${KEYS})\\s*[=:]\\s*(?:\\{\\s*)?(['"\`])((?:(?!\\1)[^\\\\]|\\\\.)*)\\1`, 'g'),
]
const SKIP_FILE = /(\.test\.tsx?$|routeTree\.gen\.ts$)/
// Route paths and code identifiers are not copy.
const NOT_COPY = /^\s*(\/[\w/$-]*|[\w$.-]+)\s*$|[=;\[\]]|^\s*[,)]/

function* walkAll(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) yield* walkAll(p)
    else if (/\.tsx?$/.test(p) && !SKIP_FILE.test(p)) yield p
  }
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.tsx$/.test(p) && !SKIP_FILE.test(p)) yield p
  }
}

const hits = []
const base = join(import.meta.dirname, '..')
// Connection (gatekeeper) authorization pages are served by their own packages; only the brand
// name is checked there because their other nouns are internal.
const packagesDir = join(base, '..')
const BRAND = /\bcloudflare os\b/i
for (const pkg of readdirSync(packagesDir)) {
  if (!/^(gatekeeper-|mcp-shared$)/.test(pkg)) continue
  const srcDir = join(packagesDir, pkg, 'src')
  let files = []
  try { files = [...walkAll(srcDir)] } catch { continue }
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    src.split('\n').forEach((line, i) => {
      if (BRAND.test(line)) hits.push(`${relative(base, file)}:${i + 1}: ${line.trim().slice(0, 110)}`)
    })
  }
}
for (const file of walk(join(base, 'src'))) {
  const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const seen = new Set()
  for (const pattern of PATTERNS) {
    for (const m of src.matchAll(pattern)) {
      const text = (m[2] ?? m[1]).replace(/\s+/g, ' ').trim()
      if (!text || NOT_COPY.test(text) || !BANNED.test(text)) continue
      const line = src.slice(0, m.index).split('\n').length
      const key = `${line}:${text}`
      if (seen.has(key)) continue
      seen.add(key)
      hits.push(`${relative(base, file)}:${line}: ${text.slice(0, 110)}`)
    }
  }
}

if (hits.length) {
  console.log(hits.join('\n'))
  console.log(`\n${hits.length} user-facing strings still use Cloudflare OS vocabulary.`)
  process.exit(1)
}
console.log('vocabulary clean')
