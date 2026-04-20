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
    <section className="space-y-7">
      <div className="text-center">
        <p className="type-caps" style={{ marginBottom: '0.5rem' }}>
          {language === 'et' ? 'lugu on räägitud' : 'the story is told'}
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontVariationSettings: "'opsz' 72",
            fontSize: '2rem',
            fontWeight: 300,
            color: 'var(--text)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>
        <div style={{ width: '2rem', height: '1px', background: 'var(--line-accent)', margin: '0.75rem auto', opacity: 0.5 }} />
      </div>

      <div className="text-left space-y-4">
        {text.split('\n').filter(Boolean).map((p, i) => (
          <p key={i} className="scene-prose">
            {p}
          </p>
        ))}
      </div>

      {/* Full story toggle */}
      {allScenes.length > 0 && (
        <div className="text-left space-y-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowFullStory((v) => !v)}
              className="type-caps"
              style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              {showFullStory ? strings.hideFullStoryBtn : strings.showFullStoryBtn}
            </button>
            <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
            <button
              type="button"
              onClick={copyToClipboard}
              className="type-caps"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: copied ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'color 0.15s',
              }}
            >
              {copied ? strings.copiedMsg : strings.copyStoryBtn}
            </button>
          </div>

          {showFullStory && (
            <div className="space-y-6">
              {allScenes.map((scene, i) => (
                <div key={i}>
                  <div className="ornament-rule type-caps" style={{ marginBottom: '0.75rem', fontSize: '0.6rem' }}>
                    {strings.sceneLabel} {String(i + 1).padStart(2, '0')}
                  </div>
                  {scene.split('\n').filter(Boolean).map((p, j) => (
                    <p key={j} style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontVariationSettings: "'opsz' 14",
                      fontSize: '0.9375rem',
                      color: 'var(--text-dim)',
                      lineHeight: 1.65,
                      marginBottom: '0.2em',
                    }}>{p}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sequel */}
      {kind === 'narrative' ? (
        <div className="space-y-3 text-left" style={{ borderTop: '1px solid var(--line)', paddingTop: '1.25rem' }}>
          <label className="type-caps" style={{ display: 'block' }}>{strings.sequelLabel}</label>
          <textarea
            value={sequelText}
            onChange={(e) => setSequelText(e.target.value)}
            rows={4}
            className="input-page resize-none"
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

      <div className="text-center" style={{ color: 'var(--text-faint)', letterSpacing: '0.4em', fontSize: '0.75rem' }}>
        · · ·
      </div>

      <button onClick={reset} className="btn-secondary w-full">
        {strings.restartBtn}
      </button>

      {error ? (
        <p style={{ color: 'var(--state-failing)', fontSize: '0.85rem' }}>{error}</p>
      ) : null}
    </section>
  )
}
