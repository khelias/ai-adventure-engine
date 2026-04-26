import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { prepareSecretsAndTransition } from '../game/actions'
import { formatAbilityForDisplay } from '../game/abilityText'
import { LoadingDots } from './LoadingDots'

export function RoleAssignmentScreen() {
  const language = useGameStore((s) => s.settings.language)
  const title = useGameStore((s) => s.title)
  const summary = useGameStore((s) => s.summary)
  const roles = useGameStore((s) => s.roles)
  const setRoleName = useGameStore((s) => s.setRoleName)
  const reset = useGameStore((s) => s.reset)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[language]

  const fillDefaultNames = () => {
    roles.forEach((_, index) => {
      setRoleName(index, `${strings.playerName} ${index + 1}`)
    })
  }

  return (
    <section className="cast-screen">
      <button
        type="button"
        onClick={reset}
        disabled={isLoading}
        className="btn-ghost btn-ghost--caps story-back"
      >
        ← {strings.backToSetup}
      </button>

      <div className="cast-header">
        <p className="type-caps">{strings.castKicker}</p>
        <h2 className="screen-title screen-title--large">{title}</h2>
        <p className="cast-summary">{summary}</p>
        <div className="title-rule title-rule--left" />
      </div>

      <div className="cast-actions">
        <button
          type="button"
          onClick={fillDefaultNames}
          className="btn-ghost btn-ghost--caps"
        >
          {strings.defaultNamesBtn}
        </button>
      </div>

      <div className="cast-grid">
        {roles.map((role, index) => (
          <div
            key={role.id}
            className="role-card"
          >
            <div className="role-card__index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </div>

            <div className="role-card__body">
              <div className="role-name-row">
                <label
                  htmlFor={`role-name-${role.id}`}
                  className="sr-only"
                >
                  {strings.playerName} {index + 1}
                </label>
                <input
                  id={`role-name-${role.id}`}
                  type="text"
                  value={role.name}
                  placeholder={strings.playerNamePlaceholder}
                  onChange={(e) => setRoleName(index, e.target.value)}
                  className="input-page role-name-input"
                />
              </div>
              <p className="role-description">
                {role.description}
              </p>
              <div className="role-ability">
                <span className="role-ability__mark" aria-hidden="true">◈</span>
                <div>
                  <span className="role-ability__label">{strings.abilityLabel}</span>
                  <p>{formatAbilityForDisplay(role)}</p>
                  {role.abilityParameter ? (
                    <span className="role-ability__anchor">{role.abilityParameter}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => void prepareSecretsAndTransition()}
        disabled={isLoading}
        className="btn-primary cast-start"
        aria-label={isLoading ? strings.loading : strings.startGameBtn}
      >
        {isLoading ? <LoadingDots /> : strings.startGameBtn}
      </button>

      {error ? (
        <p className="setup-error">{error}</p>
      ) : null}
    </section>
  )
}
