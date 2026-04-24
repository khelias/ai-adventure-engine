// Secret goals: each player holds one private win condition.
// The AI never sees these — they live entirely on the client and affect only
// how players ARGUE over choices, not what the narrator writes. Evaluated
// from final state (parameters + gameOverKind) at endgame.
//
// Design constraint: every archetype's win condition must be evaluable from
// end-state alone. No per-turn history tracking in v1 — that doubles the
// implementation surface for a prototype.

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
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Pick N distinct archetypes for N players. If N exceeds pool size, repeats
// are allowed — unlikely at ≤6 players and 6 archetypes, but we guard anyway.
function pickArchetypes(n: number): SecretArchetype[] {
  const shuffled = shuffle(ARCHETYPE_POOL)
  if (n <= shuffled.length) return shuffled.slice(0, n)
  const out: SecretArchetype[] = [...shuffled]
  while (out.length < n) out.push(shuffled[Math.floor(Math.random() * shuffled.length)])
  return out
}

export function assignSecrets(roles: Role[], parameters: Parameter[]): Secret[] {
  const archetypes = pickArchetypes(roles.length)
  const paramNames = parameters.map((p) => p.name)
  return roles.map((role, i) => {
    const archetype = archetypes[i]
    const secret: Secret = { ownerRoleId: role.id, archetype }
    if (archetype === 'keeper' || archetype === 'sacrificer') {
      secret.paramName = paramNames[Math.floor(Math.random() * paramNames.length)]
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

function isAtWorst(p: Parameter): boolean {
  return p.currentStateIndex === p.states.length - 1
}

export function evaluateSecret(secret: Secret, end: EndState): 'won' | 'lost' {
  const { parameters, gameOverKind } = end
  switch (secret.archetype) {
    case 'optimist':
      return parameters.every(isTopHalf) ? 'won' : 'lost'
    case 'traitor':
      return gameOverKind === 'parametric' ? 'won' : 'lost'
    case 'survivor':
      return gameOverKind === 'narrative' ? 'won' : 'lost'
    case 'keeper': {
      const p = parameters.find((x) => x.name === secret.paramName)
      return p && isTopHalf(p) ? 'won' : 'lost'
    }
    case 'sacrificer': {
      const p = parameters.find((x) => x.name === secret.paramName)
      return p && isAtWorst(p) ? 'won' : 'lost'
    }
    case 'guardian':
      return parameters.every((p) => !isAtWorst(p)) ? 'won' : 'lost'
  }
}

export function evaluateAll(secrets: Secret[], end: EndState): Secret[] {
  return secrets.map((s) => ({ ...s, result: evaluateSecret(s, end) }))
}
