import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateCustomStory } from '../game/actions'

export function StoryChoiceScreen() {
  const language = useGameStore((s) => s.settings.language)
  const stories = useGameStore((s) => s.availableStories)
  const initStory = useGameStore((s) => s.initStory)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[language]

  const [customText, setCustomText] = useState('')

  return (
    <section className="space-y-5 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">{strings.storyChoiceTitle}</h2>

      <div className="space-y-3">
        {stories.map((story, index) => (
          <div key={index} className="card space-y-2">
            <h3 className="text-lg font-semibold">{story.title}</h3>
            <p className="text-sm text-neutral-300">{story.summary}</p>
            <button
              className="btn-primary text-sm"
              onClick={() => initStory(story)}
            >
              {strings.useThisStoryBtn}
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t border-neutral-800">
        <h3 className="text-lg font-semibold">{strings.customStoryTitle}</h3>
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder={strings.customStoryPlaceholder}
          rows={4}
          className="w-full input-base"
        />
        <button
          onClick={() => generateCustomStory(customText)}
          disabled={isLoading || !customText.trim()}
          className="btn-secondary"
        >
          {isLoading ? strings.loading : strings.useCustomStoryBtn}
        </button>
      </div>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
    </section>
  )
}
