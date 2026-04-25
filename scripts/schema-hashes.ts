import { createHash } from 'node:crypto'
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

for (const [name, schema] of Object.entries(schemas)) {
  console.log(`${name} ${schemaHash(schema)}`)
}
