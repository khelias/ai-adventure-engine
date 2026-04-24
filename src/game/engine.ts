import type { Parameter, Role } from './types'

export interface ParameterChange {
  name: string
  change: number
}

// change=+1 → index decreases toward 0 (best). change=-1 → index increases toward last (worst).
// States are ordered best → worst.
export function applyParameterChanges(
  parameters: Parameter[],
  changes: ParameterChange[],
): Parameter[] {
  return parameters.map((p) => {
    const change = changes.find((c) => c.name === p.name)?.change ?? 0
    const next = Math.max(
      0,
      Math.min(p.states.length - 1, p.currentStateIndex - change),
    )
    const wasAtWorst = p.currentStateIndex === p.states.length - 1
    const isAtWorst = next === p.states.length - 1
    return {
      ...p,
      currentStateIndex: next,
      justBroke: !wasAtWorst && isAtWorst,
      justMoved: next !== p.currentStateIndex,
    }
  })
}

// Parameters currently sitting at their worst state.
export function findBrokenParameters(parameters: Parameter[]): Parameter[] {
  return parameters.filter((p) => p.currentStateIndex >= p.states.length - 1)
}

// Parameters that just transitioned to worst state this turn. These need to be
// dramatized in the NEXT scene (prompt layer signals the AI about this).
export function findJustBrokenParameters(parameters: Parameter[]): Parameter[] {
  return parameters.filter((p) => p.justBroke === true)
}

// Game ends mechanically only when the situation is truly unrecoverable:
// two or more parameters collapsed to worst state simultaneously.
// A single broken parameter is a narrative phase transition, not a game-over.
export function isUnrecoverable(parameters: Parameter[]): boolean {
  return findBrokenParameters(parameters).length >= 2
}

export function durationToMaxTurns(duration: 'Short' | 'Medium' | 'Long'): number {
  if (duration === 'Short') return 8
  if (duration === 'Medium') return 15
  return 20
}

// Mark a role's ability as used. The caller decides whether the choice was
// an ability — we trust the structured flag + actor id, not text parsing.
export function markAbilityUsedById(roles: Role[], actorId: number): Role[] {
  return roles.map((r) => (r.id === actorId ? { ...r, used: true } : r))
}
