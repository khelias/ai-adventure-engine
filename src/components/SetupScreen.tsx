import { useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateStories } from '../game/actions'
import type { Duration, Genre, Vibe } from '../game/types'
import { LoadingDots } from './LoadingDots'

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
  const strings = translations[settings.language]

  const [showAdvanced, setShowAdvanced] = useState(false)
  const swipeStartX = useRef<number | null>(null)

  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX
  }

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(dx) < 40) return
    const currentIdx = GENRES.findIndex((g) => g.value === genre)
    const base = currentIdx < 0 ? 0 : currentIdx
    const nextIdx = dx < 0
      ? (base + 1) % GENRES.length
      : (base - 1 + GENRES.length) % GENRES.length
    setSetting('genre', GENRES[nextIdx].value)
  }
  const ctx = settings.context
  const setCtx = (patch: Partial<typeof ctx>) =>
    setSetting('context', { ...ctx, ...patch })

  const genre = settings.genre
  const players = settings.players
  const duration = settings.duration

  const genreOption = GENRES.find((g) => g.value === genre) ?? GENRES[0]

  const hasPersonalContext = !!(
    ctx.vibe ||
    ctx.location.trim() ||
    ctx.playersDesc.trim() ||
    ctx.insideJoke.trim()
  )

  // First word of duration label (strips the parenthetical)
  const getDurationWord = (labelKey: keyof typeof translations.et) =>
    (strings[labelKey] as string).split(' ')[0]

  return (
    <section className="setup-wrap">
      <span className="setup-eyebrow">{strings.adventureKicker}</span>

      {/* The Circle */}
      <div
        className="circle-wrap"
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
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
        <span className="setup-label">{strings.playerCountQuestion}</span>
        <div className="seg-group">
          {[3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              className={`seg-btn seg-btn--num${players === n ? ' active' : ''}`}
              onClick={() => setSetting('players', n)}
              aria-pressed={players === n}
              aria-label={strings.playersAriaLabel(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="setup-section">
        <span className="setup-label">{strings.durationQuestion}</span>
        <div className="seg-group">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              className={`seg-btn${duration === d.value ? ' active' : ''}`}
              onClick={() => setSetting('duration', d.value)}
              aria-pressed={duration === d.value}
            >
              {getDurationWord(d.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Personal context — merged section (vibe + location + players) that
          makes the story feel like theirs. Formal uppercase label replaced
          with an italic Fraunces header — reads as an invitation, not a form. */}
      <div className="setup-section setup-section--tell">
        <h3 className="setup-tell-header">{strings.groupSectionHeader}</h3>
        <p className="setup-hint">{strings.groupSectionHint}</p>

        <div className="ctx-field">
          <span className="ctx-label">{strings.locationLabel}</span>
          <input
            type="text"
            value={ctx.location}
            placeholder={strings.locationPlaceholder}
            onChange={(e) => setCtx({ location: e.target.value })}
            className="input-page"
          />
        </div>
        <div className="ctx-field">
          <span className="ctx-label">{strings.playersDescLabel}</span>
          <input
            type="text"
            value={ctx.playersDesc}
            placeholder={strings.playersDescPlaceholder}
            onChange={(e) => setCtx({ playersDesc: e.target.value })}
            className="input-page"
          />
        </div>
        <div className="ctx-field">
          <span className="ctx-label">{strings.vibeLabel}</span>
          <div className="seg-group">
            {(
              [
                { value: '' as Vibe, label: strings.vibeBtnAny },
                { value: 'light' as Vibe, label: strings.vibeBtnLight },
                { value: 'tense' as Vibe, label: strings.vibeBtnTense },
                { value: 'dark' as Vibe, label: strings.vibeBtnDark },
              ] as const
            ).map((v) => (
              <button
                key={v.value}
                type="button"
                className={`seg-btn${ctx.vibe === v.value ? ' active' : ''}`}
                onClick={() => setCtx({ vibe: v.value })}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ctx-field">
          <span className="ctx-label">{strings.insideJokeLabel}</span>
          <input
            type="text"
            value={ctx.insideJoke}
            placeholder={strings.insideJokePlaceholder}
            onChange={(e) => setCtx({ insideJoke: e.target.value })}
            className="input-page"
          />
        </div>
      </div>

      {/* CTA */}
      {/* The "ready" (filled violet) state triggers once the user has made a
          personal choice — any vibe, location text, or players description.
          Empty defaults keep the button in ghost state as a subtle nudge that
          more context makes a better story. Fast-path still works — ghost
          button is still clickable and produces a playable game. */}
      <button
        className={`btn-begin${hasPersonalContext && !isLoading ? ' ready' : ''}`}
        onClick={() => generateStories()}
        disabled={isLoading}
        aria-label={isLoading ? strings.loading : strings.generateStoryBtn}
      >
        {isLoading ? <LoadingDots /> : strings.generateStoryBtn}
      </button>

      {/* Advanced — inside joke + provider only */}
      <button
        type="button"
        className="setup-advanced-toggle"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? '▴' : '▾'} {strings.advancedToggle}
      </button>

      {showAdvanced && (
        <div className="ctx-section">
          {/* Provider — technical, just here for debugging a stuck game */}
          <div className="ctx-provider">
            <span className="ctx-label">{strings.providerLabel}</span>
            <div className="seg-group" style={{ maxWidth: '16rem' }}>
              {(['claude', 'gemini'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`seg-btn${settings.provider === p ? ' active' : ''}`}
                  onClick={() => setSetting('provider', p)}
                >
                  {p === 'claude' ? 'Claude' : 'Gemini'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error ? (
        <p style={{ color: 'var(--state-failing)', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>{error}</p>
      ) : null}
    </section>
  )
}

