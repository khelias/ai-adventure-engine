import type { Language, Provider } from '../game/types'

const API_URL = '/adventure/api/generate'

// Opaque JSON schema shape — the proxy forwards it to whichever provider is
// selected. We keep it untyped deliberately; V1 schemas live in game/prompts.ts.
export type JsonSchema = Record<string, unknown>

export async function callAI<T = unknown>(
  prompt: string,
  schema: JsonSchema,
  provider: Provider,
  systemPrompt?: string,
  language?: Language,
): Promise<T> {
  const body: Record<string, unknown> = { prompt, schema, provider }
  if (systemPrompt) body.systemPrompt = systemPrompt
  if (language) body.language = language
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: 'Invalid JSON response from server' }))
    throw new Error(errorData.error || `Request failed with status ${response.status}`)
  }

  const result = await response.json()
  if (!result || typeof result.data !== 'object' || result.data === null) {
    throw new Error('Proxy returned an invalid or empty response structure.')
  }
  return result.data as T
}
