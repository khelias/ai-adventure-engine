import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  customStorySchema,
  sequelSchema,
  storyGenerationSchema,
  turnSchema,
} from '../src/game/prompts/schemas'

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]),
    )
  }
  return value
}

function schemaHash(schema: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(schema)))
    .digest('hex')
}

const schemas = {
  storyGenerationSchema,
  customStorySchema,
  sequelSchema,
  turnSchema,
}

const computedHashes = new Map(
  Object.entries(schemas).map(([name, schema]) => [name, schemaHash(schema)]),
)

for (const [name, hash] of computedHashes) {
  console.log(`${name} ${hash}`)
}

const proxySource = readFileSync(new URL('../proxy/server.js', import.meta.url), 'utf8')
const proxyHashes = new Map<string, string>()
const proxyEntryPattern = /\['([a-f0-9]{64})', '([A-Za-z0-9_]+)'\]/g

for (const match of proxySource.matchAll(proxyEntryPattern)) {
  const [, hash, name] = match
  if (hash && name) {
    proxyHashes.set(name, hash)
  }
}

const errors: string[] = []

for (const [name, hash] of computedHashes) {
  const proxyHash = proxyHashes.get(name)
  if (!proxyHash) {
    errors.push(`${name}: missing from proxy ALLOWED_SCHEMA_HASHES`)
  } else if (proxyHash !== hash) {
    errors.push(`${name}: proxy has ${proxyHash}, expected ${hash}`)
  }
}

for (const name of proxyHashes.keys()) {
  if (!computedHashes.has(name)) {
    errors.push(`${name}: present in proxy ALLOWED_SCHEMA_HASHES but not in scripts/schema-hashes.ts`)
  }
}

if (errors.length > 0) {
  console.error('\nProxy schema hash allowlist is out of sync:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
}
