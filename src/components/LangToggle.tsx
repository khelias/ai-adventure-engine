import { useGameStore } from '../store/gameStore'

export function LangToggle() {
  const language = useGameStore((s) => s.settings.language)
  const setSetting = useGameStore((s) => s.setSetting)

  return (
    <div className="flex gap-1">
      {(['et', 'en'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => setSetting('language', lang)}
          style={{
            padding: '3px 10px',
            fontSize: '0.6875rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: language === lang ? 600 : 400,
            borderRadius: '3px',
            border: `1px solid ${language === lang ? 'var(--accent)' : 'var(--line-strong)'}`,
            background: language === lang ? 'var(--accent-deep)' : 'transparent',
            color: language === lang ? '#f5f3ff' : 'var(--text-muted)',
            transition: 'all 0.15s',
            cursor: 'pointer',
          }}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
