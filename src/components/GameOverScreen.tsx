import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { generateSequel } from '../game/actions'
import { LoadingDots } from './LoadingDots'
import { downloadTranscript } from '../game/transcript'

type RevealPhase = 'prompt' | 'reveal'

export function GameOverScreen() {
  const language = useGameStore((s) => s.settings.language)
  const kind = useGameStore((s) => s.gameOverKind)
  const title = useGameStore((s) => s.gameOverTitle)
  const text = useGameStore((s) => s.gameOverText)
  const allScenes = useGameStore((s) => s.allScenes)
  const roles = useGameStore((s) => s.roles)
  const secrets = useGameStore((s) => s.secrets)
  const transcript = useGameStore((s) => s.transcript)
  const reset = useGameStore((s) => s.reset)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[language]

  const [sequelText, setSequelText] = useState(text)
  const [showFullStory, setShowFullStory] = useState(false)
  const [copied, setCopied] = useState(false)

  // Secret reveal flow state: 'idle' = not started, index = current player,
  // phase = pass-phone prompt vs revealed card, 'done' = all seen.
  const [revealIdx, setRevealIdx] = useState<number | 'idle' | 'done'>('idle')
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('prompt')

  const hasSecrets = secrets.length > 0
  const currentRevealRole =
    typeof revealIdx === 'number' ? roles[revealIdx] : null
  const currentRevealSecret = currentRevealRole
    ? secrets.find((s) => s.ownerRoleId === currentRevealRole.id)
    : null

  const onStartReveal = () => {
    setRevealIdx(0)
    setRevealPhase('prompt')
  }
  const onRevealTap = () => setRevealPhase('reveal')
  const onNextPlayer = () => {
    if (typeof revealIdx !== 'number') return
    if (revealIdx === roles.length - 1) {
      setRevealIdx('done')
    } else {
      setRevealIdx(revealIdx + 1)
      setRevealPhase('prompt')
    }
  }

  const fullStoryText = [...allScenes, text].join('\n\n—\n\n')

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(fullStoryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="space-y-7">
      <div className="text-center">
        <p className="type-caps" style={{ marginBottom: '0.5rem' }}>
          {strings.storyToldKicker}
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontVariationSettings: "'opsz' 72",
            fontSize: '2rem',
            fontWeight: 300,
            color: 'var(--text)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>
        <div style={{ width: '2rem', height: '1px', background: 'var(--line-accent)', margin: '0.75rem auto', opacity: 0.5 }} />
      </div>

      <div className="text-left space-y-4">
        {text.split('\n').filter(Boolean).map((p, i) => (
          <p key={i} className="scene-prose">
            {p}
          </p>
        ))}
      </div>

      {/* Secret reveal flow — pass-the-phone ritual after the public finale */}
      {hasSecrets && revealIdx === 'idle' && (
        <div className="text-center" style={{ borderTop: '1px solid var(--line)', paddingTop: '1.25rem' }}>
          <button onClick={onStartReveal} className="btn-secondary">
            {strings.secretsShowResultsBtn}
          </button>
        </div>
      )}

      {hasSecrets && typeof revealIdx === 'number' && currentRevealRole && currentRevealSecret && (
        <div className="space-y-5" style={{ borderTop: '1px solid var(--line)', paddingTop: '1.25rem' }}>
          <p className="type-caps text-center">{strings.secretsRevealKicker}</p>
          {revealPhase === 'prompt' ? (
            <div className="space-y-4 text-center">
              <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', color: 'var(--text-dim)' }}>
                {strings.secretsPassPhoneTo(currentRevealRole.name)}
              </p>
              <p className="type-caps" style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                {revealIdx + 1} / {roles.length}
              </p>
              <button onClick={onRevealTap} className="btn-primary w-full py-3">
                {strings.secretsRevealBtn(currentRevealRole.name)}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div style={{
                border: '1px solid var(--line-accent)',
                borderRadius: '4px',
                padding: '1.5rem',
              }}>
                <p className="type-caps" style={{ fontSize: '0.6875rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>
                  {currentRevealRole.name} · {strings.secretArchetypeName(currentRevealSecret.archetype)}
                </p>
                <p style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  color: 'var(--text-dim)',
                  margin: '0 0 1rem 0',
                }}>
                  {strings.secretDescription(currentRevealSecret.archetype, currentRevealSecret.paramName)}
                </p>
                <p style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  color: currentRevealSecret.result === 'won' ? 'var(--accent)' : 'var(--state-failing)',
                  margin: 0,
                  letterSpacing: '0.05em',
                }}>
                  {currentRevealSecret.result === 'won' ? strings.secretsResultWon : strings.secretsResultLost}
                </p>
              </div>
              <button onClick={onNextPlayer} className="btn-primary w-full py-3">
                {revealIdx === roles.length - 1 ? strings.secretsHideBtn : strings.secretsRememberBtn}
              </button>
            </div>
          )}
        </div>
      )}

      {hasSecrets && revealIdx === 'done' && (
        <div className="space-y-3" style={{ borderTop: '1px solid var(--line)', paddingTop: '1.25rem' }}>
          <p className="type-caps text-center">{strings.secretsRevealKicker}</p>
          <div className="space-y-2">
            {roles.map((r) => {
              const s = secrets.find((x) => x.ownerRoleId === r.id)
              if (!s) return null
              return (
                <div key={r.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--line)',
                  fontSize: '0.9375rem',
                }}>
                  <span style={{ color: 'var(--text)' }}>
                    {r.name} · <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{strings.secretArchetypeName(s.archetype)}</span>
                  </span>
                  <span className="type-caps" style={{
                    fontSize: '0.6875rem',
                    color: s.result === 'won' ? 'var(--accent)' : 'var(--state-failing)',
                  }}>
                    {s.result === 'won' ? strings.secretsResultWon : strings.secretsResultLost}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full story toggle */}
      {allScenes.length > 0 && (
        <div className="text-left space-y-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--line)', paddingTop: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowFullStory((v) => !v)}
              className="btn-ghost type-caps"
              style={{ fontStyle: 'normal', fontSize: '0.6875rem' }}
            >
              {showFullStory ? strings.hideFullStoryBtn : strings.showFullStoryBtn}
            </button>
            <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
            <button
              type="button"
              onClick={copyToClipboard}
              className="btn-ghost type-caps"
              style={{ fontStyle: 'normal', fontSize: '0.6875rem', color: copied ? 'var(--accent)' : undefined }}
            >
              {copied ? strings.copiedMsg : strings.copyStoryBtn}
            </button>
            {transcript ? (
              <button
                type="button"
                onClick={() => downloadTranscript(transcript)}
                className="btn-ghost type-caps"
                style={{ fontStyle: 'normal', fontSize: '0.6875rem' }}
              >
                {strings.downloadTranscriptBtn}
              </button>
            ) : null}
          </div>

          {showFullStory && (
            <div className="space-y-6">
              {allScenes.map((scene, i) => (
                <div key={i}>
                  <div className="ornament-rule type-caps" style={{ marginBottom: '0.75rem', fontSize: '0.6rem' }}>
                    {strings.sceneLabel} {String(i + 1).padStart(2, '0')}
                  </div>
                  {scene.split('\n').filter(Boolean).map((p, j) => (
                    <p key={j} style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontVariationSettings: "'opsz' 14",
                      fontSize: '0.9375rem',
                      color: 'var(--text-dim)',
                      lineHeight: 1.65,
                      marginBottom: '0.2em',
                    }}>{p}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sequel */}
      {kind === 'narrative' ? (
        <div className="space-y-3 text-left" style={{ borderTop: '1px solid var(--line)', paddingTop: '1.25rem' }}>
          <label className="type-caps" style={{ display: 'block' }} htmlFor="sequel-input">{strings.sequelLabel}</label>
          <p className="setup-hint" style={{ margin: '0 0 0.5rem 0' }}>{strings.sequelHint}</p>
          <textarea
            id="sequel-input"
            value={sequelText}
            onChange={(e) => setSequelText(e.target.value)}
            rows={4}
            className="input-page resize-none"
          />
          <button
            onClick={() => void generateSequel(sequelText)}
            disabled={isLoading || !sequelText.trim()}
            className="btn-primary"
            aria-label={isLoading ? strings.loading : strings.continueSequelBtn}
          >
            {isLoading ? <LoadingDots /> : strings.continueSequelBtn}
          </button>
        </div>
      ) : null}

      <div className="text-center" style={{ color: 'var(--text-faint)', letterSpacing: '0.4em', fontSize: '0.75rem' }}>
        · · ·
      </div>

      <button onClick={reset} className="btn-secondary w-full">
        {strings.restartBtn}
      </button>

      {error ? (
        <p style={{ color: 'var(--state-failing)', fontSize: '0.85rem' }}>{error}</p>
      ) : null}
    </section>
  )
}
