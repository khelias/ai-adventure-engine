import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { kickFirstTurn } from '../game/actions'
import { LoadingDots } from './LoadingDots'

// Pass-the-phone secret distribution. One player at a time sees their secret,
// taps "remember", passes the phone. After the last player, we kick the first
// turn and the game screen appears. No multi-device — the ritual IS the UX.
export function SecretAssignmentScreen() {
  const language = useGameStore((s) => s.settings.language)
  const roles = useGameStore((s) => s.roles)
  const secrets = useGameStore((s) => s.secrets)
  const isLoading = useGameStore((s) => s.isLoading)
  const strings = translations[language]

  // Distribution index: how many players have ALREADY seen. Starts at 0.
  const [index, setIndex] = useState(0)
  // Whether the current player's secret is currently visible on screen.
  const [revealed, setRevealed] = useState(false)

  const currentRole = roles[index]
  const currentSecret = secrets.find((s) => s.ownerRoleId === currentRole?.id)
  const isLast = index === roles.length - 1

  const onReveal = () => setRevealed(true)

  const onRememberAndPass = async () => {
    setRevealed(false)
    if (isLast) {
      // All players have seen. Kick the first turn.
      await kickFirstTurn()
    } else {
      setIndex(index + 1)
    }
  }

  if (!currentRole || !currentSecret) {
    // Shouldn't happen — assignSecrets runs before this screen mounts.
    return null
  }

  return (
    <section className="space-y-7">
      <div className="text-center">
        <p className="type-caps" style={{ marginBottom: '0.5rem' }}>
          {strings.secretsKicker}
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontVariationSettings: "'opsz' 72",
            fontSize: '1.75rem',
            fontWeight: 300,
            color: 'var(--text)',
            lineHeight: 1.25,
          }}
        >
          {strings.secretsAssignIntro}
        </h2>
        <div style={{ width: '2rem', height: '1px', background: 'var(--line-accent)', margin: '0.75rem auto', opacity: 0.5 }} />
      </div>

      {!revealed ? (
        <div className="space-y-6 text-center">
          <p className="setup-hint" style={{ margin: 0 }}>
            {strings.secretsAssignWarning}
          </p>
          <div style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: '1.0625rem',
            color: 'var(--text-dim)',
            fontStyle: 'italic',
          }}>
            {strings.secretsPassPhoneTo(currentRole.name)}
          </div>
          <div className="flex justify-center">
            <span className="type-caps" style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
              {index + 1} / {roles.length}
            </span>
          </div>
          <button onClick={onReveal} className="btn-primary w-full py-3">
            {strings.secretsRevealBtn(currentRole.name)}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div style={{
            border: '1px solid var(--line-accent)',
            borderRadius: '4px',
            padding: '1.5rem',
            background: 'var(--surface, rgba(255,255,255,0.02))',
          }}>
            <p className="type-caps" style={{ fontSize: '0.6875rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>
              {currentRole.name} · {strings.secretsYourGoalLabel}
            </p>
            <h3 style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontVariationSettings: "'opsz' 72",
              fontSize: '1.5rem',
              fontWeight: 300,
              color: 'var(--text)',
              margin: '0 0 1rem 0',
            }}>
              {strings.secretArchetypeName(currentSecret.archetype)}
            </h3>
            <p style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontVariationSettings: "'opsz' 14, 'SOFT' 50",
              fontSize: '1rem',
              lineHeight: 1.65,
              color: 'var(--text-dim)',
              margin: 0,
            }}>
              {strings.secretDescription(currentSecret.archetype, currentSecret.paramName)}
            </p>
          </div>
          <button
            onClick={onRememberAndPass}
            disabled={isLoading}
            className="btn-primary w-full py-3"
            aria-label={isLoading ? strings.loading : strings.secretsRememberBtn}
          >
            {isLoading ? <LoadingDots /> : (isLast ? strings.startGameBtn : strings.secretsRememberBtn)}
          </button>
        </div>
      )}
    </section>
  )
}
