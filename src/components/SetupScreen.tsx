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

  return (
    <section className="space-y-5 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">{strings.appTitle}</h2>

      <Field label={strings.playerCountLabel}>
        <input
          type="number"
          min={1}
          max={6}
          value={settings.players}
          onChange={(e) => setSetting('players', Math.max(1, Number(e.target.value)))}
          className="w-full input-base"
        />
      </Field>

      <Field label={strings.genreLabel}>
        <select
          value={settings.genre}
          onChange={(e) => setSetting('genre', e.target.value as Genre)}
          className="w-full input-base"
        >
          {GENRES.map((g) => (
            <option key={g.value} value={g.value}>
              {strings[g.labelKey] as string}
            </option>
          ))}
        </select>
      </Field>

      <Field label={strings.durationLabel}>
        <select
          value={settings.duration}
          onChange={(e) => setSetting('duration', e.target.value as Duration)}
          className="w-full input-base"
        >
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {strings[d.labelKey] as string}
            </option>
          ))}
        </select>
      </Field>

      <Field label={strings.providerLabel}>
        <select
          value={settings.provider}
          onChange={(e) =>
            setSetting('provider', e.target.value as 'claude' | 'gemini')
          }
          className="w-full input-base"
        >
          <option value="gemini">{strings.providerGemini}</option>
          <option value="claude">{strings.providerClaude}</option>
        </select>
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
