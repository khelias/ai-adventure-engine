import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateStories } from '../game/actions'
import type { Duration, Genre, Vibe } from '../game/types'

const GENRES: { value: Genre; labelKey: keyof typeof translations.et }[] = [
  { value: 'Zombies', labelKey: 'genreZombies' },
  { value: 'Fantasy', labelKey: 'genreFantasy' },
  { value: 'Sci-Fi', labelKey: 'genreSciFi' },
  { value: 'Thriller', labelKey: 'genreThriller' },
  { value: 'Cyberpunk', labelKey: 'genreCyberpunk' },
  { value: 'Post-Apocalyptic', labelKey: 'genrePostApocalyptic' },
]

const DURATIONS: { value: Duration; labelKey: keyof typeof translations.et }[] = [
  { value: 'Short', labelKey: 'durationShort' },
  { value: 'Medium', labelKey: 'durationMedium' },
  { value: 'Long', labelKey: 'durationLong' },
]

const PLAYER_COUNTS = [3, 4, 5, 6]

export function SetupScreen() {
  const settings = useGameStore((s) => s.settings)
  const setSetting = useGameStore((s) => s.setSetting)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[settings.language]

  const [showAdvanced, setShowAdvanced] = useState(false)

  const ctx = settings.context
  const setCtx = (patch: Partial<typeof ctx>) =>
    setSetting('context', { ...ctx, ...patch })

  const playerCount = PLAYER_COUNTS.includes(settings.players) ? settings.players : 3

  return (
    <section className="space-y-5 max-w-md mx-auto">
      <div>
        <h2 className="game-title">{strings.appTitle}</h2>
        <div className="ornament" />
      </div>

      <Field label={strings.playerCountLabel}>
        <div className="flex gap-1">
          {PLAYER_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSetting('players', n)}
              className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
                playerCount === n ? 'chip-active' : 'chip'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      <Field label={strings.genreLabel}>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setSetting('genre', g.value)}
              className={`chip ${settings.genre === g.value ? 'chip-active' : ''}`}
            >
              {strings[g.labelKey] as string}
            </button>
          ))}
        </div>
      </Field>

      <Field label={strings.durationLabel}>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setSetting('duration', d.value)}
              className={`chip ${settings.duration === d.value ? 'chip-active' : ''}`}
            >
              {strings[d.labelKey] as string}
            </button>
          ))}
        </div>
      </Field>

      <div className="border border-neutral-800 rounded">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <span>{strings.advancedToggle}</span>
          <span className="text-xs">{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 space-y-4 border-t border-neutral-800 pt-4">
            <Field label={strings.locationLabel}>
              <input
                type="text"
                value={ctx.location}
                placeholder={strings.locationPlaceholder}
                onChange={(e) => setCtx({ location: e.target.value })}
                className="w-full input-base"
              />
            </Field>

            <Field label={strings.playersDescLabel}>
              <input
                type="text"
                value={ctx.playersDesc}
                placeholder={strings.playersDescPlaceholder}
                onChange={(e) => setCtx({ playersDesc: e.target.value })}
                className="w-full input-base"
              />
            </Field>

            <Field label={strings.vibeLabel}>
              <select
                value={ctx.vibe}
                onChange={(e) => setCtx({ vibe: e.target.value as Vibe })}
                className="w-full input-base"
              >
                <option value="">{strings.vibeAny}</option>
                <option value="light">{strings.vibeLight}</option>
                <option value="tense">{strings.vibeTense}</option>
                <option value="dark">{strings.vibeDark}</option>
              </select>
            </Field>

            <Field label={strings.insideJokeLabel}>
              <input
                type="text"
                value={ctx.insideJoke}
                placeholder={strings.insideJokePlaceholder}
                onChange={(e) => setCtx({ insideJoke: e.target.value })}
                className="w-full input-base"
              />
            </Field>

            <Field label={strings.providerLabel}>
              <select
                value={settings.provider}
                onChange={(e) =>
                  setSetting('provider', e.target.value as 'claude' | 'gemini')
                }
                className="w-full input-base"
              >
                <option value="claude">{strings.providerClaude}</option>
                <option value="gemini">{strings.providerGemini}</option>
              </select>
            </Field>
          </div>
        )}
      </div>

      <button
        onClick={generateStories}
        disabled={isLoading}
        className="w-full btn-primary"
      >
        {isLoading ? strings.loading : strings.generateStoryBtn}
      </button>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
    </section>
  )
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-neutral-400">{props.label}</span>
      {props.children}
    </label>
  )
}
