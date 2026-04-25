import type { Role } from './types'

export function formatAbilityForDisplay(role: Pick<Role, 'name' | 'ability'>): string {
  const text = role.ability.trim()
  const name = role.name.trim()
  if (!name || !text.toLocaleLowerCase().startsWith(name.toLocaleLowerCase())) {
    return text
  }

  const rest = text.slice(name.length)
  if (!rest || !/^[\s:.-]/.test(rest)) return text

  const stripped = rest.replace(/^[\s:.-]+/, '').trim()
  if (!stripped) return text

  return stripped.charAt(0).toLocaleUpperCase() + stripped.slice(1)
}
