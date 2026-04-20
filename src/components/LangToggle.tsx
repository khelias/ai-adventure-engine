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
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderRadius: '3px',
            border: `1px solid ${language === lang ? 'var(--gild)' : 'var(--frame-edge)'}`,
            background: language === lang ? 'var(--gild)' : 'transparent',
            color: language === lang ? '#0d0a06' : '#5a4a38',
            fontWeight: language === lang ? 600 : 400,
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
