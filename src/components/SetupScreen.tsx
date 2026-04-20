import { useState } from 'react'
import type { ReactNode } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateStories } from '../game/actions'
import type { Duration, Genre, Vibe } from '../game/types'

interface GenreOption {
  value: Genre
  labelKey: keyof typeof translations.et
  icon: ReactNode
}

const GENRES: GenreOption[] = [
  {
    value: 'Zombies',
    labelKey: 'genreZombies',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
        <path d="M6.5 9.5C6.5 6 9 3 12 3s5.5 3 5.5 6.5c0 2-.9 3.8-2.3 5L15 17H9l-.2-2.5C7.4 13.3 6.5 11.5 6.5 9.5z"/>
        <path d="M9 17v4M12 17v4M15 17v4"/>
        <circle cx="9.5" cy="9.5" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="14.5" cy="9.5" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    value: 'Fantasy',
    labelKey: 'genreFantasy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
        <path d="M3 20h18M3 20V11l5 5L12 3l4 13 5-5v9"/>
        <circle cx="3" cy="11" r="1.8" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="3" r="1.8" fill="currentColor" stroke="none"/>
        <circle cx="21" cy="11" r="1.8" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    value: 'Sci-Fi',
    labelKey: 'genreSciFi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="40" height="40">
        <circle cx="12" cy="12" r="4.5"/>
        <ellipse cx="12" cy="12" rx="10.5" ry="3.5" transform="rotate(-25 12 12)"/>
      </svg>
    ),
  },
  {
    value: 'Thriller',
    labelKey: 'genreThriller',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
        <path d="M2 12c3.3-5 7-8 10-8s6.7 3 10 8c-3.3 5-7 8-10 8S5.3 17 2 12z"/>
        <circle cx="12" cy="12" r="3.5"/>
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    value: 'Cyberpunk',
    labelKey: 'genreCyberpunk',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
        <path d="M12 2l9 10-9 10L3 12z"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M3 12h3.5M17.5 12H21M12 3v3.5M12 17.5V21"/>
      </svg>
    ),
  },
  {
    value: 'Post-Apocalyptic',
    labelKey: 'genrePostApocalyptic',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="40" height="40">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>
        <path d="M10.5 8.5l2 3.5-1.5 4" strokeDasharray="2 1.5" strokeWidth="1.8"/>
      </svg>
    ),
  },
]

const DURATION_OPTIONS: { value: Duration; labelKey: keyof typeof translations.et }[] = [
  { value: 'Short', labelKey: 'durationShort' },
  { value: 'Medium', labelKey: 'durationMedium' },
  { value: 'Long', labelKey: 'durationLong' },
]

export function SetupScreen() {
  const settings = useGameStore((s) => s.settings)
  const setSetting = useGameStore((s) => s.setSetting)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const language = settings.language
  const strings = translations[language]

  const [showAdvanced, setShowAdvanced] = useState(false)
  const ctx = settings.context
  const setCtx = (patch: Partial<typeof ctx>) =>
    setSetting('context', { ...ctx, ...patch })

  const genre = settings.genre
  const players = settings.players
  const duration = settings.duration

  const genreOption = GENRES.find((g) => g.value === genre) ?? GENRES[0]
  const playersLabel = language === 'et' ? 'Mängijad' : 'Players'
  const durationLabel = language === 'et' ? 'Kestvus' : 'Duration'

  // First word of duration label (strips the parenthetical)
  const getDurationWord = (labelKey: keyof typeof translations.et) =>
    (strings[labelKey] as string).split(' ')[0]

  return (
    <section className="setup-wrap">
      <span className="setup-eyebrow">adventure</span>

      {/* The Circle */}
      <div className="circle-wrap">
        <div className={`circle-beam${genre ? ' active' : ''}`} />
        <div className={`circle${genre ? ' active' : ''}`}>
          <span className={`circle__icon${genre ? ' visible' : ''}`}>
            {genreOption.icon}
          </span>
        </div>
        <p className={`circle-genre-name${genre ? ' active' : ''}`}>
          {strings[genreOption.labelKey] as string}
        </p>
        <div className="genre-dots" role="group" aria-label={strings.genreLabel}>
          {GENRES.map((g) => (
            <button
              key={g.value}
              type="button"
              className={`genre-dot${genre === g.value ? ' active' : ''}`}
              aria-label={strings[g.labelKey] as string}
              aria-pressed={genre === g.value}
              onClick={() => setSetting('genre', g.value)}
            />
          ))}
        </div>
      </div>

      {/* Players */}
      <div className="setup-section">
        <span className="setup-label">{playersLabel}</span>
        <div className="player-btns">
          {[3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              className={`player-btn${players === n ? ' active' : ''}`}
              onClick={() => setSetting('players', n)}
              aria-pressed={players === n}
            >
              <span className="player-btn__num">{n}</span>
              <span className="player-btn__dot" />
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="setup-section">
        <span className="setup-label">{durationLabel}</span>
        <div className="duration-btns">
          {DURATION_OPTIONS.map((d, i) => (
            <div key={d.value} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {i > 0 && <span className="duration-sep">·</span>}
              <button
                type="button"
                className={`duration-btn${duration === d.value ? ' active' : ''}`}
                onClick={() => setSetting('duration', d.value)}
                aria-pressed={duration === d.value}
              >
                {getDurationWord(d.labelKey)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        className={`btn-begin${!isLoading ? ' ready' : ''}`}
        onClick={() => generateStories()}
        disabled={isLoading}
      >
        {isLoading ? strings.loading : strings.generateStoryBtn}
      </button>

      {/* Advanced */}
      <button
        type="button"
        className="setup-advanced-toggle"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? '▴' : '▾'} {strings.advancedToggle}
      </button>

      {showAdvanced && (
        <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '0.875rem', paddingTop: '0.5rem' }}>
          <AdvancedField label={strings.locationLabel}>
            <input type="text" value={ctx.location} placeholder={strings.locationPlaceholder}
              onChange={(e) => setCtx({ location: e.target.value })} className="input-base" />
          </AdvancedField>
          <AdvancedField label={strings.playersDescLabel}>
            <input type="text" value={ctx.playersDesc} placeholder={strings.playersDescPlaceholder}
              onChange={(e) => setCtx({ playersDesc: e.target.value })} className="input-base" />
          </AdvancedField>
          <AdvancedField label={strings.vibeLabel}>
            <select value={ctx.vibe} onChange={(e) => setCtx({ vibe: e.target.value as Vibe })} className="input-base">
              <option value="">{strings.vibeAny}</option>
              <option value="light">{strings.vibeLight}</option>
              <option value="tense">{strings.vibeTense}</option>
              <option value="dark">{strings.vibeDark}</option>
            </select>
          </AdvancedField>
          <AdvancedField label={strings.insideJokeLabel}>
            <input type="text" value={ctx.insideJoke} placeholder={strings.insideJokePlaceholder}
              onChange={(e) => setCtx({ insideJoke: e.target.value })} className="input-base" />
          </AdvancedField>
          <AdvancedField label={strings.providerLabel}>
            <select value={settings.provider}
              onChange={(e) => setSetting('provider', e.target.value as 'claude' | 'gemini')}
              className="input-base">
              <option value="claude">{strings.providerClaude}</option>
              <option value="gemini">{strings.providerGemini}</option>
            </select>
          </AdvancedField>
        </div>
      )}

      {error ? (
        <p style={{ color: 'var(--state-failing)', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>{error}</p>
      ) : null}
    </section>
  )
}

function AdvancedField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
        {label}
      </span>
      {children}
    </div>
  )
}
