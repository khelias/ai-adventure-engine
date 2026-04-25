import type { Language, Provider } from '../game/types'

const API_URL = '/adventure/api/generate'

// Opaque JSON schema shape — the proxy forwards it to whichever provider is
// selected. We keep it untyped deliberately; V1 schemas live in game/prompts.ts.
export type JsonSchema = Record<string, unknown>

const secret = import.meta.env.VITE_API_SECRET || ''

async function generateSignature(payloadStr: string): Promise<string> {
  if (!secret) return ''
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

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

  const payloadStr = JSON.stringify(body)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const sig = await generateSignature(payloadStr)
  if (sig) {
    headers['x-adventure-signature'] = sig
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: payloadStr,
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
