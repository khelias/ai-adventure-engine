import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'

export function LangToggle() {
  const language = useGameStore((s) => s.settings.language)
  const setSetting = useGameStore((s) => s.setSetting)
  const strings = translations[language]

  return (
    <div className="lang-toggle" role="group" aria-label={strings.languageToggleLabel}>
      {(['et', 'en'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setSetting('language', lang)}
          className={`lang-toggle__btn${language === lang ? ' active' : ''}`}
          aria-pressed={language === lang}
          title={lang === 'et' ? strings.languageEstonian : strings.languageEnglish}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
