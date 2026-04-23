import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { startGameAndFirstTurn } from '../game/actions'
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
    <section className="space-y-7">
      <button type="button" onClick={reset} disabled={isLoading} className="btn-ghost" style={{ fontStyle: 'normal', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.5rem 0' }}>
        ← {language === 'et' ? 'seadistused' : 'setup'}
      </button>
      <div className="space-y-2">
        <p className="type-caps">{language === 'et' ? 'rollid' : 'cast'}</p>
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
          {title}
        </h2>
        <p style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontVariationSettings: "'opsz' 14, 'SOFT' 50",
          fontSize: '0.9375rem',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}>
          {summary}
        </p>
        <div style={{ width: '2rem', height: '1px', background: 'var(--line-accent)', marginTop: '0.25rem', opacity: 0.5 }} />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={fillDefaultNames}
          className="btn-ghost type-caps"
          style={{ fontStyle: 'normal', fontSize: '0.6875rem' }}
        >
          {strings.defaultNamesBtn}
        </button>
      </div>

      <div className="space-y-5">
        {roles.map((role, index) => (
          <div
            key={role.id}
            style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.25rem' }}
          >
            <div className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span
                  style={{
                    color: 'var(--accent)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    minWidth: '1.2rem',
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <input
                  type="text"
                  value={role.name}
                  placeholder={strings.playerNamePlaceholder}
                  onChange={(e) => setRoleName(index, e.target.value)}
                  className="input-page flex-1"
                  style={{ fontWeight: 500, fontSize: '1.0625rem' }}
                />
              </div>
              <p style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontVariationSettings: "'opsz' 14",
                fontSize: '0.9375rem',
                color: 'var(--text-dim)',
                paddingLeft: '2rem',
                lineHeight: 1.6,
              }}>
                {role.description}
              </p>
              <div style={{ paddingLeft: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontSize: '0.875rem', flexShrink: 0, lineHeight: 1.6, opacity: 0.7 }}>◈</span>
                <p style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontVariationSettings: "'opsz' 14",
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  lineHeight: 1.55,
                }}>
                  {role.ability}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={startGameAndFirstTurn}
        disabled={isLoading}
        className="w-full btn-primary py-3"
        aria-label={isLoading ? strings.loading : strings.startGameBtn}
      >
        {isLoading ? <LoadingDots /> : strings.startGameBtn}
      </button>

      {error ? (
        <p style={{ color: 'var(--state-failing)', fontSize: '0.85rem' }}>{error}</p>
      ) : null}
    </section>
  )
}
