import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateSequel } from '../game/actions'

export function GameOverScreen() {
  const language = useGameStore((s) => s.settings.language)
  const kind = useGameStore((s) => s.gameOverKind)
  const title = useGameStore((s) => s.gameOverTitle)
  const text = useGameStore((s) => s.gameOverText)
  const reset = useGameStore((s) => s.reset)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[language]

  const [sequelText, setSequelText] = useState(text)

  return (
    <section className="space-y-5 max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="card text-left whitespace-pre-line leading-relaxed">
        {text}
      </div>

      {kind === 'narrative' ? (
        <div className="space-y-3 text-left">
          <label className="block space-y-1.5">
            <span className="text-sm text-neutral-400">{strings.sequelLabel}</span>
            <textarea
              value={sequelText}
              onChange={(e) => setSequelText(e.target.value)}
              rows={5}
              className="w-full input-base"
            />
          </label>
          <button
            onClick={() => generateSequel(sequelText)}
            disabled={isLoading || !sequelText.trim()}
            className="btn-primary"
          >
            {isLoading ? strings.loading : strings.continueSequelBtn}
          </button>
        </div>
      ) : null}

      <button onClick={reset} className="btn-secondary">
        {strings.restartBtn}
      </button>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
    </section>
  )
}
