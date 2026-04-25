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
  const nextButtonLabel = isLast ? strings.startGameBtn : strings.secretsRememberBtn

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
    <section className="secret-screen space-y-7">
      <div className="secret-header">
        <p className="type-caps">
          {strings.secretsKicker}
        </p>
        <h2 className="screen-title">
          {strings.secretsAssignIntro}
        </h2>
        <div className="title-rule" />
      </div>

      {!revealed ? (
        <div className="space-y-6 text-center">
          <p className="secret-warning">
            {strings.secretsAssignWarning}
          </p>
          <div className="secret-pass-to">
            {strings.secretsPassPhoneTo(currentRole.name)}
          </div>
          <div className="flex justify-center">
            <span className="secret-progress type-caps">
              {index + 1} / {roles.length}
            </span>
          </div>
          <button onClick={onReveal} className="btn-primary w-full py-3">
            {strings.secretsRevealBtn(currentRole.name)}
          </button>
        </div>
      ) : (
        <div className="space-y-5 fade-in">
          <div className="secret-document-card">
            <div className="secret-stamp">{strings.secretsDocumentStamp}</div>

            <p className="secret-document-kicker type-caps">
              {strings.secretsGoalFor(currentRole.name)}
            </p>
            <h3 className="secret-document-title">
              {strings.secretArchetypeName(currentSecret.archetype)}
            </h3>
            <p className="secret-document-body">
              {strings.secretDescription(currentSecret.archetype, currentSecret.paramName)}
            </p>
          </div>
          <button
            onClick={onRememberAndPass}
            disabled={isLoading}
            className="btn-primary w-full py-3"
            aria-label={isLoading ? strings.loading : nextButtonLabel}
          >
            {isLoading ? <LoadingDots /> : nextButtonLabel}
          </button>
        </div>
      )}
    </section>
  )
}
