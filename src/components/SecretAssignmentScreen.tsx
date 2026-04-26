import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { kickFirstTurn } from '../game/actions'
import { LoadingDots } from './LoadingDots'
import { SecretSigil } from './SecretSigil'

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
  const progressItems = roles.map((role, roleIndex) => ({
    id: role.id,
    label: roleIndex + 1,
    state:
      roleIndex < index
        ? 'done'
        : roleIndex === index
          ? 'active'
          : 'pending',
  }))

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
    <section className="secret-screen">
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
        <div className="secret-handoff fade-in">
          <div className="secret-progress-rail" aria-hidden="true">
            {progressItems.map((item) => (
              <span
                key={item.id}
                className={`secret-progress-dot secret-progress-dot--${item.state}`}
              >
                {item.label}
              </span>
            ))}
          </div>

          <div className="secret-handoff-card">
            <div className="secret-lock-mark" aria-hidden="true">
              <span />
            </div>
            <div className="secret-handoff-copy">
              <span className="secret-progress type-caps">
                {strings.secretsHandoffMeta(index + 1, roles.length)}
              </span>
              <h3>{strings.secretsHandoffTitle(currentRole.name)}</h3>
              <p>{strings.secretsPrivacyNote}</p>
              <span className="secret-warning">
                {strings.secretsAssignWarning}
              </span>
            </div>
          </div>

          <button onClick={onReveal} className="btn-primary secret-primary-action">
            {strings.secretsRevealBtn(currentRole.name)}
          </button>
        </div>
      ) : (
        <div className="secret-reveal fade-in">
          <div className="secret-document-card">
            <div className="secret-document-top">
              <span className="secret-document-file">{strings.secretsDossierLabel}</span>
              <span className="secret-document-number">
                {String(index + 1).padStart(2, '0')} / {String(roles.length).padStart(2, '0')}
              </span>
            </div>

            <div className="secret-stamp">{strings.secretsDocumentStamp}</div>

            <div className="secret-document-owner">
              <SecretSigil archetype={currentSecret.archetype} />
              <div>
                <p className="secret-document-kicker type-caps">
                  {strings.secretsGoalFor(currentRole.name)}
                </p>
                <h3 className="secret-document-title">
                  {strings.secretArchetypeName(currentSecret.archetype)}
                </h3>
              </div>
            </div>

            <div className="secret-document-grid">
              <div className="secret-document-block secret-document-block--wide">
                <span>{strings.secretsGoalTypeLabel}</span>
                <p>{strings.secretDescription(currentSecret.archetype, currentSecret.paramName)}</p>
              </div>

              {currentSecret.paramName ? (
                <div className="secret-document-block">
                  <span>{strings.secretsTargetLabel}</span>
                  <strong>{currentSecret.paramName}</strong>
                </div>
              ) : null}
            </div>
          </div>

          <div className="secret-reveal-footer">
            <span className="secret-progress type-caps">
              {strings.secretsHandoffMeta(index + 1, roles.length)}
            </span>
            <button
              onClick={() => void onRememberAndPass()}
              disabled={isLoading}
              className="btn-primary secret-primary-action"
              aria-label={isLoading ? strings.loading : nextButtonLabel}
            >
              {isLoading ? <LoadingDots /> : nextButtonLabel}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
