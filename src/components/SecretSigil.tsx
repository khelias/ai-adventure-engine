import type { SecretArchetype } from '../game/types'

export function SecretSigil({ archetype }: { archetype?: SecretArchetype }) {
  const kind = archetype ?? 'guardian'

  return (
    <svg
      className={`secret-sigil secret-sigil--${kind}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {kind === 'traitor' || kind === 'sacrificer' ? (
        <>
          <path d="M12 3 20 19H4L12 3Z" />
          <path d="m9.5 12 5 5" />
          <path d="m14.5 12-5 5" />
        </>
      ) : kind === 'optimist' || kind === 'guardian' ? (
        <>
          <path d="M12 3 19 6.5v5.2c0 4.6-2.8 7.4-7 9.3-4.2-1.9-7-4.7-7-9.3V6.5L12 3Z" />
          <path d="m8.5 12.2 2.2 2.2 4.8-5" />
        </>
      ) : kind === 'keeper' ? (
        <>
          <path d="M7 11V8a5 5 0 0 1 10 0v3" />
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M12 15v2" />
        </>
      ) : (
        <>
          <path d="M4 12c2.1-3.4 4.8-5.1 8-5.1s5.9 1.7 8 5.1c-2.1 3.4-4.8 5.1-8 5.1S6.1 15.4 4 12Z" />
          <circle cx="12" cy="12" r="2.4" />
        </>
      )}
    </svg>
  )
}
