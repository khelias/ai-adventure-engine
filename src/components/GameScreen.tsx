import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { handlePlayerChoice } from '../game/actions'
import type { Choice, Parameter } from '../game/types'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function toRoman(n: number): string {
  return ROMAN[n - 1] ?? String(n)
}

export function GameScreen() {
  const language = useGameStore((s) => s.settings.language)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const maxTurns = useGameStore((s) => s.maxTurns)
  const parameters = useGameStore((s) => s.parameters)
  const roles = useGameStore((s) => s.roles)
  const sceneText = useGameStore((s) => s.sceneText)
  const choices = useGameStore((s) => s.choices)
  const isLoading = useGameStore((s) => s.isLoading)
  const error = useGameStore((s) => s.error)
  const strings = translations[language]

  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentTurn])

  const onChoice = (choice: Choice) => {
    setShowCustomInput(false)
    setCustomText('')
    if (choice.isAbility && choice.roleIndex !== undefined) {
      const role = roles[choice.roleIndex]
      if (!role || role.used) return
      const abilityText =
        language === 'et'
          ? `[${role.name}] Kasuta erioskust: ${role.ability}`
          : `[${role.name}] Use special ability: ${role.ability}`
      void handlePlayerChoice(abilityText)
    } else {
      void handlePlayerChoice(choice.text)
    }
  }

  const onCustomSubmit = () => {
    const text = customText.trim()
    if (!text) return
    setShowCustomInput(false)
    setCustomText('')
    void handlePlayerChoice(text, { isFreeText: true })
  }

  const ribbonHeight = maxTurns > 0 ? Math.max((currentTurn / maxTurns) * 100, 8) : 8

  const paragraphs = sceneText.split('\n').filter(Boolean)

  return (
    <section>
      {/* Silk ribbon bookmark */}
      <div className="ribbon" style={{ height: `${ribbonHeight}%` }} />

      {/* Wax seal parameters — frame panel above the page text */}
      <div
        className="flex justify-around items-center py-3 px-2 mb-6 rounded"
        style={{ background: 'rgba(26,21,16,0.06)', borderBottom: '1px solid var(--page-edge)' }}
      >
        {parameters.map((p) => (
          <SealParameter key={p.name} param={p} />
        ))}
        <div className="text-right">
          <div className="type-fell" style={{ color: 'var(--vermilion)', fontSize: '1.1rem', lineHeight: 1 }}>
            {toRoman(currentTurn)}
          </div>
          <div className="type-caps" style={{ fontSize: '0.58rem', marginTop: '2px' }}>
            {language === 'et' ? 'stseen' : 'scene'}
          </div>
        </div>
      </div>

      {/* Scene text */}
      <div key={currentTurn} className="scene-fade space-y-0">
        {isLoading && !sceneText ? (
          <div className="py-8 text-center">
            <span className="type-fell" style={{ color: 'var(--gild)', fontSize: '0.85rem', letterSpacing: '0.15em' }}>
              {language === 'et' ? '· tint voolab ·' : '· ink flows ·'}
            </span>
          </div>
        ) : (
          paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className={`type-prose ink-reveal ink-reveal-${Math.min(i + 1, 4)} ${i === 0 && currentTurn === 1 ? 'drop-cap' : ''}`}
              style={{ marginBottom: i < paragraphs.length - 1 ? '0.2em' : 0 }}
            >
              {paragraph}
            </p>
          ))
        )}
        {isLoading && sceneText ? (
          <p className="type-fell text-center py-2" style={{ color: 'var(--gild)', fontSize: '0.85rem', letterSpacing: '0.12em' }}>
            · · ·
          </p>
        ) : null}
      </div>

      {/* Choices */}
      {!isLoading && choices.length > 0 ? (
        <div className="mt-6">
          <div className="ornament-rule type-caps mb-3" style={{ fontSize: '0.6rem' }}>
            {strings.choiceTitle}
          </div>

          <div style={{ paddingLeft: '1.5rem' }}>
            {choices.map((choice, i) => {
              const abilityRole =
                choice.isAbility && choice.roleIndex !== undefined
                  ? roles[choice.roleIndex]
                  : null
              const isUsed = abilityRole ? abilityRole.used : false
              return (
                <button
                  key={i}
                  onClick={() => onChoice(choice)}
                  disabled={isUsed || isLoading}
                  className={`choice-marginalia w-full text-left ${isUsed ? 'opacity-40' : ''}`}
                >
                  <span className="choice-numeral">{toRoman(i + 1)}.</span>
                  <span className="choice-text">
                    {choice.text}{isUsed ? ` — ${strings.usedLabel}` : ''}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Custom input */}
          <div className="mt-3" style={{ paddingLeft: '1.5rem' }}>
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="type-fell transition-colors"
                style={{ color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '0.95rem' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
              >
                {strings.customChoiceLink}…
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={strings.customChoicePlaceholder}
                  rows={2}
                  className="input-page resize-none"
                  style={{ fontStyle: 'italic', fontSize: '1rem' }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onCustomSubmit()
                    }
                  }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={onCustomSubmit}
                    disabled={!customText.trim()}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    {strings.customChoiceSubmit}
                  </button>
                  <button
                    onClick={() => { setShowCustomInput(false); setCustomText('') }}
                    style={{ color: 'var(--ink-faint)', fontSize: '0.8rem' }}
                  >
                    {strings.customChoiceCancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-red-600 text-sm mt-4 type-caps">{error}</p> : null}
    </section>
  )
}

function SealParameter({ param }: { param: Parameter }) {
  const maxIdx = param.states.length - 1
  const fill = maxIdx > 0 ? (maxIdx - param.currentStateIndex) / maxIdx : 1
  const isCritical = param.currentStateIndex >= maxIdx

  const sealColor = isCritical
    ? 'var(--state-failing)'
    : fill > 0.66
      ? 'var(--state-vital)'
      : fill > 0.33
        ? 'var(--state-waning)'
        : 'var(--state-failing)'

  const fillPct = Math.round(fill * 100)

  return (
    <div className={`seal-wrap ${isCritical ? 'seal-critical' : ''}`}>
      <div
        className="seal"
        style={{
          background: `conic-gradient(${sealColor} ${fillPct}%, rgba(26,21,16,0.15) ${fillPct}%)`,
          boxShadow: isCritical
            ? `0 0 0 2px ${sealColor}, 0 0 16px rgba(168,52,28,0.4)`
            : `0 0 0 1px rgba(26,21,16,0.2), 0 2px 8px rgba(0,0,0,0.15)`,
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'var(--page)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="type-fell"
            style={{
              fontSize: '0.7rem',
              color: isCritical ? 'var(--vermilion)' : 'var(--ink-soft)',
              lineHeight: 1,
              fontStyle: 'italic',
            }}
          >
            {param.name.charAt(0)}
          </span>
        </div>
      </div>
      <div className="seal-label">{param.states[param.currentStateIndex]}</div>
    </div>
  )
}
