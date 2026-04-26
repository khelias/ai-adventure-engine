// Secret goals: each player holds one private win condition.
// The AI never sees these — they live entirely on the client and affect only
// how players ARGUE over choices, not what the narrator writes. Evaluated
// from final state (parameters + gameOverKind) at endgame.
//
// Design constraint: every archetype's win condition must be evaluable from
// end-state alone. No per-turn history tracking in v1 — that doubles the
// implementation surface for a prototype.
//
// "Narrative" vs "parametric" is an engine route, not enough by itself to
// decide social-deduction outcomes. A final-turn narrative can still be a
// collapse if multiple parameters end at worst. Score secrets from the final
// parameter state first, then use gameOverKind only where it adds meaning.

import type { GameOverKind, Parameter, Role, Secret, SecretArchetype } from './types'

const ARCHETYPE_POOL: SecretArchetype[] = [
  'optimist',
  'traitor',
  'survivor',
  'keeper',
  'sacrificer',
  'guardian',
]

function shuffle<T>(xs: T[]): T[] {
  const out = [...xs]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = out[i]
    const swap = out[j]
    if (current !== undefined && swap !== undefined) {
      out[i] = swap
      out[j] = current
    }
  }
  return out
}

// Pick N distinct archetypes for N players. Ensure that the core three
// agendas are always distributed if N >= 3: collapse, neutral survival, and
// perfect-state finish.
function pickArchetypes(n: number): SecretArchetype[] {
  const base: SecretArchetype[] = ['traitor', 'survivor', 'optimist']
  const shuffledBase = shuffle(base)
  if (n <= shuffledBase.length) return shuffledBase.slice(0, n)

  const others = shuffle(ARCHETYPE_POOL.filter(a => !base.includes(a)))
  const combined = [...shuffledBase, ...others]
  const out = combined.slice(0, n)

  // Fill if we have more players than the total pool (unlikely)
  while (out.length < n) {
    out.push(ARCHETYPE_POOL[Math.floor(Math.random() * ARCHETYPE_POOL.length)] ?? 'survivor')
  }

  return shuffle(out)
}

export function assignSecrets(roles: Role[], parameters: Parameter[]): Secret[] {
  if (parameters.length === 0) return []
  const goalParameters = secretEligibleParameters(parameters)
  const archetypes = pickArchetypes(roles.length)
  return roles.map((role, i) => {
    const archetype = archetypes[i] ?? 'survivor'
    const secret: Secret = { ownerRoleId: role.id, archetype }
    if (archetype === 'keeper' || archetype === 'sacrificer') {
      const chosen = goalParameters[Math.floor(Math.random() * goalParameters.length)] ?? goalParameters[0]
      if (!chosen) return secret
      secret.paramName = chosen.name
    }
    return secret
  })
}

export interface EndState {
  parameters: Parameter[]
  gameOverKind: GameOverKind
}

function isTopHalf(p: Parameter): boolean {
  // 4-state params: top half = index 0 or 1.
  // Generic: index strictly less than half the range.
  return p.currentStateIndex < Math.ceil(p.states.length / 2)
}

function isBestState(p: Parameter): boolean {
  return p.currentStateIndex === 0
}

function isAtWorst(p: Parameter): boolean {
  return p.currentStateIndex === p.states.length - 1
}

function secretEligibleParameters(parameters: Parameter[]): Parameter[] {
  const eligible = parameters.filter((p) => p.archetype !== 'time')
  return eligible.length > 0 ? eligible : parameters
}

function worstCount(parameters: Parameter[]): number {
  return parameters.filter(isAtWorst).length
}

export function evaluateSecret(secret: Secret, end: EndState): 'won' | 'lost' {
  const { gameOverKind } = end
  const parameters = secretEligibleParameters(end.parameters)
  const collapsed = worstCount(parameters) >= 2
  const contained = worstCount(parameters) === 0
  switch (secret.archetype) {
    case 'optimist':
      return parameters.every(isBestState) ? 'won' : 'lost'
    case 'traitor':
      return collapsed || gameOverKind === 'parametric' ? 'won' : 'lost'
    case 'survivor':
      return gameOverKind === 'narrative' && !collapsed ? 'won' : 'lost'
    case 'keeper': {
      const p = parameters.find((x) => x.name === secret.paramName)
      return p && isTopHalf(p) ? 'won' : 'lost'
    }
    case 'sacrificer': {
      const p = parameters.find((x) => x.name === secret.paramName)
      return p && isAtWorst(p) ? 'won' : 'lost'
    }
    case 'guardian':
      return contained ? 'won' : 'lost'
  }
}

export function evaluateAll(secrets: Secret[], end: EndState): Secret[] {
  return secrets.map((s) => ({ ...s, result: evaluateSecret(s, end) }))
}
