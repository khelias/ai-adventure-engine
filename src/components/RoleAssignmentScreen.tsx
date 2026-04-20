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
    <section className="space-y-7">
      <div className="space-y-2">
        <p className="type-caps">{language === 'et' ? 'rollid' : 'cast'}</p>
        <h2
          className="type-fell"
          style={{ fontSize: '1.75rem', fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.25 }}
        >
          {title}
        </h2>
        <p className="type-prose" style={{ fontSize: '0.95rem', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
          {summary}
        </p>
        <div style={{ width: '2rem', height: '1px', background: 'var(--page-edge)', marginTop: '0.25rem' }} />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={fillDefaultNames}
          className="type-caps transition-colors"
          style={{ color: 'var(--ink-faint)', fontSize: '0.65rem' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
        >
          {strings.defaultNamesBtn}
        </button>
      </div>

      <div className="space-y-5">
        {roles.map((role, index) => (
          <div
            key={role.id}
            style={{ borderBottom: '1px solid var(--page-edge)', paddingBottom: '1.25rem' }}
          >
            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span
                  className="type-fell"
                  style={{ color: 'var(--vermilion)', fontSize: '1.1rem', minWidth: '1.2rem', flexShrink: 0 }}
                >
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={role.name}
                  placeholder={strings.playerNamePlaceholder}
                  onChange={(e) => setRoleName(index, e.target.value)}
                  className="input-page flex-1"
                  style={{ fontWeight: 600, fontSize: '1.05rem' }}
                />
              </div>
              <p
                className="type-prose"
                style={{ fontSize: '0.95rem', color: 'var(--ink-soft)', paddingLeft: '2rem' }}
              >
                {role.description}
              </p>
              <div
                style={{
                  paddingLeft: '2rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  className="type-fell"
                  style={{ color: 'var(--gild)', fontSize: '1rem', flexShrink: 0, lineHeight: 1.5 }}
                >
                  ❧
                </span>
                <p
                  className="type-prose"
                  style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', fontStyle: 'italic' }}
                >
                  {role.ability}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={startGameAndFirstTurn} disabled={isLoading} className="w-full btn-primary py-3">
        {isLoading ? strings.loading : strings.startGameBtn}
      </button>

      {error ? <p style={{ color: 'var(--vermilion)', fontSize: '0.85rem' }}>{error}</p> : null}
    </section>
  )
}
