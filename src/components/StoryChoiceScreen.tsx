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
    <section className="story-choice-screen">
      <button
        type="button"
        onClick={reset}
        disabled={isLoading}
        className="btn-ghost btn-ghost--caps story-back"
      >
        ← {strings.backToSetup}
      </button>

      <div className="story-choice-hero">
        <div>
          <p className="type-caps">{strings.yourAdventureKicker}</p>
          <h2 className={`screen-title screen-title--large${isLoading ? ' is-loading' : ''}`}>
            {isLoading ? strings.loadingStoryTitle : story?.title ?? ''}
          </h2>
          <div className="title-rule title-rule--left" />
        </div>
      </div>

      {isLoading ? (
        <div className="story-skeleton" aria-hidden="true">
          {[100, 85, 70].map((w, i) => (
            <div
              key={i}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ) : story ? (
        <div className="story-premise-card">
          <div className="story-premise-main">
            <p className="story-summary">{story.summary}</p>
            <div className="story-meta-grid">
              <div className="story-meta-block">
                <span className="story-meta-label">{strings.parametersTitle}</span>
                <div className="story-token-row">
                  {story.parameters.map((parameter) => (
                    <span key={parameter.name} className="story-token">
                      {parameter.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="story-meta-block">
                <span className="story-meta-label">{strings.castKicker}</span>
                <div className="story-token-row">
                  {story.roles.map((role) => (
                    <span key={role.name} className="story-token story-token--muted">
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="story-action-row">
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

      <div className="custom-premise-panel">
        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="btn-ghost custom-premise-toggle"
          >
            {strings.customStoryTitle}…
          </button>
        ) : (
          <div className="custom-premise-form">
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
                className="btn-primary"
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
        <p className="setup-error type-caps">{error}</p>
      ) : null}
    </section>
  )
}
