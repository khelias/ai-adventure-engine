import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateStories, generateCustomStory } from '../game/actions'
import { LoadingDots } from './LoadingDots'

export function StoryChoiceScreen() {
  const language = useGameStore((s) => s.settings.language)
  const stories = useGameStore((s) => s.availableStories)
  const initStory = useGameStore((s) => s.initStory)
  const reset = useGameStore((s) => s.reset)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[language]

  const [customText, setCustomText] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const story = stories[0]

  return (
    <section className="space-y-8">
      <button type="button" onClick={reset} disabled={isLoading} className="btn-ghost" style={{ fontStyle: 'normal', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.5rem 0' }}>
        ← {strings.backToSetup}
      </button>
      <div>
        <p className="type-caps" style={{ marginBottom: '0.5rem' }}>
          {strings.yourAdventureKicker}
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
            ? strings.loadingStoryTitle
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
            <button
              className="btn-primary"
              onClick={() => initStory(story)}
              disabled={isLoading}
            >
              {strings.useThisStoryBtn}
            </button>
            <button
              className="btn-secondary"
              onClick={() => void generateStories()}
              disabled={isLoading}
              aria-busy={isLoading}
            >
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
            className="btn-ghost"
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
                aria-label={isLoading ? strings.loading : strings.useCustomStoryBtn}
              >
                {isLoading ? <LoadingDots /> : strings.useCustomStoryBtn}
              </button>
              <button
                type="button"
                onClick={() => { setShowCustom(false); setCustomText('') }}
                className="btn-ghost"
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
