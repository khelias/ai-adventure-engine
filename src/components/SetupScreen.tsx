import { useState } from 'react'
import type { ReactNode } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateStories } from '../game/actions'
import type { Duration, Genre, Vibe } from '../game/types'

const LATIN_TITLES: Record<Genre, string> = {
  Zombies: 'Codex Mortuorum',
  Fantasy: 'Liber Arcana',
  'Sci-Fi': 'Codex Stellarum',
  Thriller: 'Liber Umbrarum',
  Cyberpunk: 'Codex Cyberneticus',
  'Post-Apocalyptic': 'Liber Finis',
}

const RIBBON_HEIGHT: Record<number, number> = { 3: 52, 4: 75, 5: 102, 6: 133 }

const TALLIES = [
  { value: 3, mark: 'III' },
  { value: 4, mark: 'IV' },
  { value: 5, mark: 'V' },
  { value: 6, mark: 'VI' },
]

const DURATION_NOTCHES: { value: Duration; mark: string }[] = [
  { value: 'Short', mark: '—' },
  { value: 'Medium', mark: '——' },
  { value: 'Long', mark: '———' },
]

interface GenreOption {
  value: Genre
  labelKey: keyof typeof translations.et
  sigil: ReactNode
}

const GENRES: GenreOption[] = [
  {
    value: 'Zombies',
    labelKey: 'genreZombies',
    sigil: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    sigil: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18"/>
        <path d="M3 20V11l5 5L12 3l4 13 5-5v9"/>
        <circle cx="3" cy="11" r="1.8" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="3" r="1.8" fill="currentColor" stroke="none"/>
        <circle cx="21" cy="11" r="1.8" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    value: 'Sci-Fi',
    labelKey: 'genreSciFi',
    sigil: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.5"/>
        <ellipse cx="12" cy="12" rx="10.5" ry="3.5" transform="rotate(-25 12 12)"/>
      </svg>
    ),
  },
  {
    value: 'Thriller',
    labelKey: 'genreThriller',
    sigil: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12c3.3-5 7-8 10-8s6.7 3 10 8c-3.3 5-7 8-10 8S5.3 17 2 12z"/>
        <circle cx="12" cy="12" r="3.5"/>
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    value: 'Cyberpunk',
    labelKey: 'genreCyberpunk',
    sigil: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l9 10-9 10L3 12z"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M3 12h3.5M17.5 12H21M12 3v3.5M12 17.5V21"/>
      </svg>
    ),
  },
  {
    value: 'Post-Apocalyptic',
    labelKey: 'genrePostApocalyptic',
    sigil: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>
        <path d="M10.5 8.5l2 3.5-1.5 4" strokeDasharray="2 1.5" strokeWidth="1.8"/>
      </svg>
    ),
  },
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

  const playersLegend = language === 'et' ? 'mängijad' : 'players'
  const durationLegend = language === 'et' ? 'kestvus' : 'duration'

  return (
    <section style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>

      {/* Grimoire cover */}
      <div className="tome" data-genre={genre} data-duration={duration}>
        <div className="tome__fore-edge" />
        <div
          className="tome__ribbon"
          style={{ height: `${RIBBON_HEIGHT[players] ?? 75}px` }}
        />

        <div className="tome__inner" style={{ paddingBottom: '110px' }}>

          <div className="tome__cartouche">
            <span className="tome__eyebrow">adventura</span>
            <h1 className="tome__title">{LATIN_TITLES[genre]}</h1>
          </div>

          <fieldset className="sigils has-selection">
            {GENRES.map((g) => (
              <label key={g.value} className={`sigil${genre === g.value ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="genre"
                  value={g.value}
                  checked={genre === g.value}
                  onChange={() => setSetting('genre', g.value)}
                />
                <span className="sigil__glyph">{g.sigil}</span>
                <span className="sigil__name">{strings[g.labelKey] as string}</span>
              </label>
            ))}
          </fieldset>

          <div className="cover-rail">
            <fieldset className="tallies">
              <legend>{playersLegend}</legend>
              <div className="tallies__btns">
                {TALLIES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`tally-btn${players === t.value ? ' active' : ''}`}
                    onClick={() => setSetting('players', t.value)}
                  >
                    {t.mark}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="notches">
              <legend>{durationLegend}</legend>
              <div className="notches__btns">
                {DURATION_NOTCHES.map((n) => (
                  <button
                    key={n.value}
                    type="button"
                    className={`notch-btn${duration === n.value ? ' active' : ''}`}
                    onClick={() => setSetting('duration', n.value)}
                  >
                    {n.mark}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

        </div>

        <button
          className="wax-seal"
          onClick={() => generateStories()}
          disabled={isLoading}
          aria-label={strings.generateStoryBtn}
        >
          <span className="wax-seal__text">
            <span className="wax-seal__legend">fatum</span>
            <span className="wax-seal__star">✦</span>
          </span>
        </button>
      </div>

      {/* Advanced options */}
      <div className="tome-advanced">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: showAdvanced ? 'var(--prose-soft)' : 'var(--prose-faint)',
            padding: '0.4rem 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
        >
          {showAdvanced ? '▴' : '▾'} {strings.advancedToggle}
        </button>

        {showAdvanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.5rem' }}>
            <AdvancedField label={strings.locationLabel}>
              <input type="text" value={ctx.location}
                placeholder={strings.locationPlaceholder}
                onChange={(e) => setCtx({ location: e.target.value })}
                className="input-base" />
            </AdvancedField>
            <AdvancedField label={strings.playersDescLabel}>
              <input type="text" value={ctx.playersDesc}
                placeholder={strings.playersDescPlaceholder}
                onChange={(e) => setCtx({ playersDesc: e.target.value })}
                className="input-base" />
            </AdvancedField>
            <AdvancedField label={strings.vibeLabel}>
              <select value={ctx.vibe}
                onChange={(e) => setCtx({ vibe: e.target.value as Vibe })}
                className="input-base">
                <option value="">{strings.vibeAny}</option>
                <option value="light">{strings.vibeLight}</option>
                <option value="tense">{strings.vibeTense}</option>
                <option value="dark">{strings.vibeDark}</option>
              </select>
            </AdvancedField>
            <AdvancedField label={strings.insideJokeLabel}>
              <input type="text" value={ctx.insideJoke}
                placeholder={strings.insideJokePlaceholder}
                onChange={(e) => setCtx({ insideJoke: e.target.value })}
                className="input-base" />
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
      </div>

      {error ? (
        <p style={{ color: 'var(--vermilion)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
      ) : null}
    </section>
  )
}

function AdvancedField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span style={{
        display: 'block',
        fontSize: '0.62rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--prose-faint)',
        marginBottom: '0.3rem',
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}
