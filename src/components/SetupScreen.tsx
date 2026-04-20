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
    <section className="space-y-7">
      {/* Title */}
      <div>
        <h1
          className="type-fell"
          style={{
            fontSize: '2.8rem',
            color: 'var(--gild)',
            lineHeight: 1.1,
            fontStyle: 'italic',
            textShadow: '0 2px 20px rgba(184,137,58,0.3)',
          }}
        >
          {strings.appTitle}
        </h1>
        <div style={{ width: '3rem', height: '1px', background: 'linear-gradient(to right, var(--gild), transparent)', marginTop: '0.5rem', opacity: 0.7 }} />
      </div>

      {/* Player count */}
      <div className="space-y-2">
        <label className="type-caps-frame" style={{ display: 'block' }}>{strings.playerCountLabel}</label>
        <div className="flex gap-1.5">
          {PLAYER_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSetting('players', n)}
              className={`flex-1 py-2 rounded text-sm font-medium transition-all ${playerCount === n ? 'chip-active' : 'chip'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Genre */}
      <div className="space-y-2">
        <label className="type-caps-frame" style={{ display: 'block' }}>{strings.genreLabel}</label>
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
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="type-caps-frame" style={{ display: 'block' }}>{strings.durationLabel}</label>
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
      </div>

      {/* Advanced */}
      <div
        className="rounded"
        style={{ border: '1px solid var(--frame-edge)' }}
      >
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 transition-colors"
          style={{ color: '#5a4a38', fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          <span>{strings.advancedToggle}</span>
          <span style={{ fontSize: '0.65rem' }}>{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div
            className="px-4 pb-4 space-y-4"
            style={{ borderTop: '1px solid var(--frame-edge)', paddingTop: '1rem' }}
          >
            <FrameField label={strings.locationLabel}>
              <input type="text" value={ctx.location} placeholder={strings.locationPlaceholder}
                onChange={(e) => setCtx({ location: e.target.value })} className="w-full input-base" />
            </FrameField>
            <FrameField label={strings.playersDescLabel}>
              <input type="text" value={ctx.playersDesc} placeholder={strings.playersDescPlaceholder}
                onChange={(e) => setCtx({ playersDesc: e.target.value })} className="w-full input-base" />
            </FrameField>
            <FrameField label={strings.vibeLabel}>
              <select value={ctx.vibe} onChange={(e) => setCtx({ vibe: e.target.value as Vibe })} className="w-full input-base">
                <option value="">{strings.vibeAny}</option>
                <option value="light">{strings.vibeLight}</option>
                <option value="tense">{strings.vibeTense}</option>
                <option value="dark">{strings.vibeDark}</option>
              </select>
            </FrameField>
            <FrameField label={strings.insideJokeLabel}>
              <input type="text" value={ctx.insideJoke} placeholder={strings.insideJokePlaceholder}
                onChange={(e) => setCtx({ insideJoke: e.target.value })} className="w-full input-base" />
            </FrameField>
            <FrameField label={strings.providerLabel}>
              <select value={settings.provider}
                onChange={(e) => setSetting('provider', e.target.value as 'claude' | 'gemini')}
                className="w-full input-base"
              >
                <option value="claude">{strings.providerClaude}</option>
                <option value="gemini">{strings.providerGemini}</option>
              </select>
            </FrameField>
          </div>
        )}
      </div>

      <button onClick={generateStories} disabled={isLoading} className="w-full btn-primary py-3">
        {isLoading ? strings.loading : strings.generateStoryBtn}
      </button>

      {error ? <p style={{ color: 'var(--vermilion)', fontSize: '0.85rem' }}>{error}</p> : null}
    </section>
  )
}

function FrameField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a4a38' }}>{label}</span>
      {children}
    </div>
  )
}
