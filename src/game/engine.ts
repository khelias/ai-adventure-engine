import type { Parameter, Role } from './types'

export interface ParameterChange {
  name: string
  change: number
}

// V1 parity: change=-1 means *worse* (index increases toward last state),
// change=+1 means *better* (index decreases toward 0). States are ordered
// best → worst.
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
    return { ...p, currentStateIndex: next }
  })
}

export function findCriticalParameter(
  parameters: Parameter[],
): Parameter | null {
  return (
    parameters.find((p) => p.currentStateIndex >= p.states.length - 1) ?? null
  )
}

export function durationToMaxTurns(duration: 'Short' | 'Medium' | 'Long'): number {
  if (duration === 'Short') return 8
  if (duration === 'Medium') return 15
  return 20
}

export function markAbilityUsed(roles: Role[], choiceText: string): Role[] {
  // V1 parity: the ability-choice text contains "[RoleName]" marker.
  const match = choiceText.match(/\[(.*?)\]/)
  if (!match?.[1]) return roles
  const roleName = match[1]
  return roles.map((r) => (r.name === roleName ? { ...r, used: true } : r))
}

export function isAbilityChoice(text: string): boolean {
  return (
    text.includes('Kasuta erioskust:') || text.includes('Use special ability:')
  )
}
