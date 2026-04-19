import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { startGameAndFirstTurn } from '../game/actions'

export function RoleAssignmentScreen() {
  const language = useGameStore((s) => s.settings.language)
  const title = useGameStore((s) => s.title)
  const summary = useGameStore((s) => s.summary)
  const roles = useGameStore((s) => s.roles)
  const setRoleName = useGameStore((s) => s.setRoleName)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[language]

  return (
    <section className="space-y-5 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-neutral-300">{summary}</p>
      </div>

      <h3 className="text-lg font-semibold">{strings.roleAssignTitle}</h3>

      <div className="space-y-3">
        {roles.map((role, index) => (
          <div key={role.id} className="card space-y-2">
            <label className="block space-y-1.5">
              <span className="text-sm text-neutral-400">
                {strings.playerName} {index + 1}:{' '}
                <strong className="text-neutral-100">{role.name}</strong>
              </span>
              <input
                type="text"
                value={role.name}
                placeholder={strings.playerNamePlaceholder}
                onChange={(e) => setRoleName(index, e.target.value)}
                className="w-full input-base"
              />
            </label>
            <p className="text-sm text-neutral-300">{role.description}</p>
            <p className="text-sm">
              <span className="text-neutral-400">{strings.abilityLabel}:</span>{' '}
              {role.ability}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={startGameAndFirstTurn}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? strings.loading : strings.startGameBtn}
      </button>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
    </section>
  )
}
