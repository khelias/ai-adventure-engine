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
        <p className="type-caps" style={{ marginBottom: '0.4rem' }}>
          {language === 'et' ? 'teie seiklus' : 'your adventure'}
        </p>
        <h2
          className="type-fell"
          style={{
            fontSize: isLoading ? '1.4rem' : '1.75rem',
            fontStyle: 'italic',
            color: 'var(--ink)',
            lineHeight: 1.25,
            minHeight: '2rem',
          }}
        >
          {isLoading
            ? (language === 'et' ? 'Tint voolab…' : 'Ink flows…')
            : story?.title ?? ''}
        </h2>
        <div style={{ width: '2rem', height: '1px', background: 'var(--page-edge)', marginTop: '0.6rem' }} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[100, 90, 75].map((w, i) => (
            <div
              key={i}
              className="type-prose"
              style={{
                height: '1.2em',
                width: `${w}%`,
                background: 'var(--page-edge)',
                borderRadius: '2px',
                opacity: 0.5 - i * 0.1,
                animation: `seal-pulse ${1.8 + i * 0.3}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      ) : story ? (
        <div className="space-y-5">
          <p className="type-prose">{story.summary}</p>
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

      <div style={{ borderTop: '1px solid var(--page-edge)', paddingTop: '1.25rem' }}>
        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="type-fell transition-colors"
            style={{ color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '0.95rem' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
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
              style={{ fontStyle: 'italic', fontSize: '1rem' }}
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
                style={{ color: 'var(--ink-faint)', fontSize: '0.85rem' }}
              >
                {strings.customChoiceCancel}
              </button>
            </div>
          </div>
        )}
      </div>

      {error ? <p style={{ color: 'var(--vermilion)', fontSize: '0.85rem' }} className="type-caps">{error}</p> : null}
    </section>
  )
}
