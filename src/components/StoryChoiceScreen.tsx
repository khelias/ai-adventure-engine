import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateStories, generateCustomStory } from '../game/actions'

export function StoryChoiceScreen() {
  const language = useGameStore((s) => s.settings.language)
  const stories = useGameStore((s) => s.availableStories)
  const initStory = useGameStore((s) => s.initStory)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[language]

  const [customText, setCustomText] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const story = stories[0]

  return (
    <section className="space-y-8">
      <div>
        <p className="type-caps" style={{ marginBottom: '0.5rem' }}>
          {language === 'et' ? 'teie seiklus' : 'your adventure'}
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontVariationSettings: "'opsz' 72",
            fontSize: isLoading ? '1.4rem' : '1.75rem',
            fontWeight: 300,
            color: 'var(--text)',
            lineHeight: 1.25,
            minHeight: '2rem',
            transition: 'font-size 0.2s',
          }}
        >
          {isLoading
            ? (language === 'et' ? 'Tint voolab…' : 'Ink flows…')
            : story?.title ?? ''}
        </h2>
        <div style={{ width: '2rem', height: '1px', background: 'var(--line-accent)', marginTop: '0.75rem', opacity: 0.6 }} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[100, 85, 70].map((w, i) => (
            <div
              key={i}
              style={{
                height: '1.1em',
                width: `${w}%`,
                background: 'var(--line-strong)',
                borderRadius: '2px',
                opacity: 0.4 - i * 0.08,
              }}
            />
          ))}
        </div>
      ) : story ? (
        <div className="space-y-5">
          <p style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontVariationSettings: "'opsz' 14, 'SOFT' 50",
            fontSize: '1.0625rem',
            lineHeight: 1.7,
            color: 'var(--text-dim)',
          }}>
            {story.summary}
          </p>
          <div className="flex gap-3 items-center">
            <button className="btn-primary" onClick={() => initStory(story)}>
              {strings.useThisStoryBtn}
            </button>
            <button className="btn-secondary" onClick={generateStories}>
              {strings.regenerateBtn}
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.25rem' }}>
        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            style={{
              color: 'var(--text-faint)',
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '0.95rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem 0',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
          >
            {strings.customStoryTitle}…
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={strings.customStoryPlaceholder}
              rows={4}
              className="input-page resize-none"
              autoFocus
            />
            <div className="flex gap-3 items-center">
              <button
                onClick={() => generateCustomStory(customText)}
                disabled={isLoading || !customText.trim()}
                className="btn-primary text-xs py-1.5 px-4"
              >
                {isLoading ? strings.loading : strings.useCustomStoryBtn}
              </button>
              <button
                onClick={() => { setShowCustom(false); setCustomText('') }}
                style={{ color: 'var(--text-faint)', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {strings.customChoiceCancel}
              </button>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p style={{ color: 'var(--state-failing)', fontSize: '0.85rem' }} className="type-caps">{error}</p>
      ) : null}
    </section>
  )
}
