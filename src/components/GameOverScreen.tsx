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
    <section className="space-y-7 text-center">
      <div>
        <p className="type-caps" style={{ marginBottom: '0.5rem' }}>
          {language === 'et' ? 'lugu on räägitud' : 'the story is told'}
        </p>
        <h2
          className="type-fell"
          style={{ fontSize: '2rem', fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.2 }}
        >
          {title}
        </h2>
        <div className="ornament-rule type-fell" style={{ margin: '0.75rem 0', color: 'var(--ink-faint)', fontSize: '1rem' }}>
          ❧
        </div>
      </div>

      <div className="text-left space-y-3">
        {text.split('\n').filter(Boolean).map((p, i) => (
          <p key={i} className="type-prose ink-reveal" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}>
            {p}
          </p>
        ))}
      </div>

      {/* Full story toggle */}
      {allScenes.length > 0 && (
        <div className="text-left space-y-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--page-edge)', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowFullStory((v) => !v)}
              className="type-caps transition-colors"
              style={{ color: 'var(--ink-faint)', fontSize: '0.65rem' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
            >
              {showFullStory ? strings.hideFullStoryBtn : strings.showFullStoryBtn}
            </button>
            <div style={{ flex: 1, height: '1px', background: 'var(--page-edge)' }} />
            <button
              type="button"
              onClick={copyToClipboard}
              className="type-caps transition-colors"
              style={{ color: copied ? 'var(--gild)' : 'var(--ink-faint)', fontSize: '0.65rem' }}
            >
              {copied ? strings.copiedMsg : strings.copyStoryBtn}
            </button>
          </div>

          {showFullStory && (
            <div className="space-y-6">
              {allScenes.map((scene, i) => (
                <div key={i}>
                  <div className="ornament-rule type-caps" style={{ marginBottom: '0.75rem', fontSize: '0.6rem' }}>
                    {strings.sceneLabel} {i + 1}
                  </div>
                  {scene.split('\n').filter(Boolean).map((p, j) => (
                    <p key={j} className="type-prose" style={{ fontSize: '0.95rem', marginBottom: '0.15em' }}>{p}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sequel */}
      {kind === 'narrative' ? (
        <div className="space-y-3 text-left" style={{ borderTop: '1px solid var(--page-edge)', paddingTop: '1.25rem' }}>
          <label className="type-caps" style={{ display: 'block', fontSize: '0.65rem' }}>{strings.sequelLabel}</label>
          <textarea
            value={sequelText}
            onChange={(e) => setSequelText(e.target.value)}
            rows={4}
            className="input-page resize-none"
            style={{ fontStyle: 'italic' }}
          />
          <button
            onClick={() => generateSequel(sequelText)}
            disabled={isLoading || !sequelText.trim()}
            className="btn-primary"
          >
            {isLoading ? strings.loading : strings.continueSequelBtn}
          </button>
        </div>
      ) : null}

      <div className="type-fell" style={{ color: 'var(--ink-faint)', fontSize: '1.5rem', letterSpacing: '0.2em' }}>
        · · ·
      </div>

      <button onClick={reset} className="btn-secondary">
        {strings.restartBtn}
      </button>

      {error ? <p style={{ color: 'var(--vermilion)', fontSize: '0.85rem' }}>{error}</p> : null}
    </section>
  )
}
