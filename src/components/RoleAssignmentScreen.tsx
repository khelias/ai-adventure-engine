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

  const fillDefaultNames = () => {
    roles.forEach((_, index) => {
      setRoleName(index, `${strings.playerName} ${index + 1}`)
    })
  }

  return (
    <section className="space-y-5 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h2 className="game-title">{title}</h2>
        <div className="ornament" />
        <p className="text-neutral-300">{summary}</p>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{strings.roleAssignTitle}</h3>
        <button
          type="button"
          onClick={fillDefaultNames}
          className="text-sm px-3 py-1.5 rounded transition-colors"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          {strings.defaultNamesBtn}
        </button>
      </div>

      <div className="space-y-3">
        {roles.map((role, index) => (
          <div key={role.id} className="card space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm text-neutral-400">
                {strings.playerName} {index + 1}
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
            <div
              className="rounded px-3 py-2.5"
              style={{ background: 'var(--surface-alt)', borderLeft: '2px solid var(--accent)', boxShadow: '-6px 0 20px rgba(184,66,50,0.12)' }}
            >
              <span className="label-caps block mb-1">{strings.abilityLabel}</span>
              <span className="text-sm text-neutral-200 font-medium">{role.ability}</span>
            </div>
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
