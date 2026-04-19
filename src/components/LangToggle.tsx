import { useGameStore } from '../store/gameStore'

export function LangToggle() {
  const language = useGameStore((s) => s.settings.language)
  const setSetting = useGameStore((s) => s.setSetting)

  const base =
    'px-3 py-1 text-sm rounded transition-colors border border-neutral-700'
  const active = 'bg-neutral-100 text-neutral-900 border-neutral-100'
  const idle = 'text-neutral-400 hover:text-neutral-100'

  return (
    <div className="flex gap-1">
      <button
        className={`${base} ${language === 'et' ? active : idle}`}
        onClick={() => setSetting('language', 'et')}
      >
        ET
      </button>
      <button
        className={`${base} ${language === 'en' ? active : idle}`}
        onClick={() => setSetting('language', 'en')}
      >
        EN
      </button>
    </div>
  )
}
