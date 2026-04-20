import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateSequel } from '../game/actions'

export function GameOverScreen() {
  const language = useGameStore((s) => s.settings.language)
  const kind = useGameStore((s) => s.gameOverKind)
  const title = useGameStore((s) => s.gameOverTitle)
  const text = useGameStore((s) => s.gameOverText)
  const allScenes = useGameStore((s) => s.allScenes)
  const reset = useGameStore((s) => s.reset)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[language]

  const [sequelText, setSequelText] = useState(text)
  const [showFullStory, setShowFullStory] = useState(false)
  const [copied, setCopied] = useState(false)

  const fullStoryText = [...allScenes, text].join('\n\n—\n\n')

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(fullStoryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="space-y-5 max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-bold">{title}</h2>

      <div className="card text-left space-y-4">
        {text.split('\n').filter(Boolean).map((p, i) => (
          <p key={i} className="scene-text">{p}</p>
        ))}
      </div>

      {/* Collapsible full story */}
      {allScenes.length > 0 && (
        <div className="text-left space-y-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFullStory((v) => !v)}
              className="text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              {showFullStory ? strings.hideFullStoryBtn : strings.showFullStoryBtn}
            </button>
            <div className="flex-1 h-px" style={{ background: 'var(--border-dim)' }} />
            <button
              type="button"
              onClick={copyToClipboard}
              className="text-sm transition-colors"
              style={{ color: copied ? 'var(--accent)' : 'var(--text-muted)' }}
              onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              {copied ? strings.copiedMsg : strings.copyStoryBtn}
            </button>
          </div>

          {showFullStory && (
            <div className="card space-y-6 text-left">
              {allScenes.map((scene, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="label-caps">{strings.sceneLabel} {i + 1}</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border-dim)' }} />
                  </div>
                  {scene.split('\n').filter(Boolean).map((p, j) => (
                    <p key={j} className="scene-text text-base">{p}</p>
                  ))}
                </div>
              ))}
              <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <span className="label-caps">{title}</span>
                {text.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i} className="scene-text text-base">{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
