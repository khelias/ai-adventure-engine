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
    <section className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h2 className="game-title">{strings.storyChoiceTitle}</h2>
        <div className="ornament" />
      </div>

      {isLoading ? (
        <div className="card space-y-4 animate-pulse">
          <div className="h-6 rounded" style={{ background: 'var(--border)', width: '55%' }} />
          <div className="space-y-2">
            <div className="h-4 rounded" style={{ background: 'var(--border)', width: '100%' }} />
            <div className="h-4 rounded" style={{ background: 'var(--border)', width: '90%' }} />
            <div className="h-4 rounded" style={{ background: 'var(--border)', width: '70%' }} />
          </div>
          <div className="h-9 rounded" style={{ background: 'var(--border)', width: '40%' }} />
        </div>
      ) : story ? (
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold" style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontWeight: 400 }}>{story.title}</h3>
          <p className="scene-text text-base">{story.summary}</p>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => initStory(story)}>
              {strings.useThisStoryBtn}
            </button>
            <button className="btn-secondary" onClick={generateStories}>
              {strings.regenerateBtn}
            </button>
          </div>
        </div>
      ) : null}

      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="text-sm italic transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
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
              className="w-full input-base"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => generateCustomStory(customText)}
                disabled={isLoading || !customText.trim()}
                className="btn-secondary"
              >
                {isLoading ? strings.loading : strings.useCustomStoryBtn}
              </button>
              <button
                onClick={() => { setShowCustom(false); setCustomText('') }}
                className="btn-secondary text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                {strings.customChoiceCancel}
              </button>
            </div>
          </div>
        )}
      </div>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
    </section>
  )
}
