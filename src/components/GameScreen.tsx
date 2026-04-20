import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { handlePlayerChoice } from '../game/actions'
import type { Choice, Parameter } from '../game/types'

export function GameScreen() {
  const language = useGameStore((s) => s.settings.language)
  const duration = useGameStore((s) => s.settings.duration)
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

  const durationLabel =
    duration === 'Short'
      ? strings.durationShort
      : duration === 'Medium'
        ? strings.durationMedium
        : strings.durationLong

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

  const progressPct = Math.round((currentTurn / maxTurns) * 100)

  return (
    <section className="max-w-2xl mx-auto space-y-0">

      {/* ── Turn progress + params ── */}
      <div className="rounded-t border border-b-0 px-5 py-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <span className="label-caps shrink-0">{strings.turn} {currentTurn}/{maxTurns}</span>
          <div className="flex-1 h-px rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'var(--text-muted)', boxShadow: '2px 0 8px rgba(110,99,90,0.6)' }}
            />
          </div>
          <span className="label-caps shrink-0 opacity-60">{durationLabel.split(' ')[0]}</span>
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {parameters.map((p) => (
            <ParameterBar key={p.name} param={p} />
          ))}
        </div>
      </div>

      {/* ── Scene ── */}
      <div
        key={currentTurn}
        className="scene-fade border-x border-b-0 border-t px-6 py-8 space-y-5"
        style={{ background: 'var(--surface-alt)', borderColor: 'var(--border)', borderTopColor: 'var(--accent)', borderTopWidth: '2px', boxShadow: 'inset 0 14px 40px rgba(184,66,50,0.05)' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="label-caps">{strings.sceneLabel} {currentTurn}</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-dim)' }} />
        </div>

        {isLoading && !sceneText ? (
          <p className="scene-text opacity-30">{strings.loading}</p>
        ) : (
          sceneText
            .split('\n')
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i} className="scene-text">
                {paragraph}
              </p>
            ))
        )}
        {isLoading && sceneText ? (
          <p className="label-caps opacity-40">{strings.loading}</p>
        ) : null}
      </div>

      {/* ── Choices ── */}
      {!isLoading && choices.length > 0 ? (
        <div className="border rounded-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="px-5 pt-4 pb-1">
            <span className="label-caps">{strings.choiceTitle}</span>
          </div>
          <div className="p-3 space-y-1.5">
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
                  className="choice-btn"
                >
                  <span className="choice-num">{i + 1}</span>
                  <span>{choice.text}{isUsed ? ` (${strings.usedLabel})` : ''}</span>
                </button>
              )
            })}
          </div>

          {/* Custom input */}
          <div className="px-3 pb-3">
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full text-left px-5 py-2.5 rounded text-sm transition-colors flex items-center gap-3"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
              >
                <span className="choice-btn-arrow opacity-40">›</span>
                <span className="italic">{strings.customChoiceLink}…</span>
              </button>
            ) : (
              <div className="space-y-2 px-2">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={strings.customChoicePlaceholder}
                  rows={2}
                  className="input-base resize-none text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onCustomSubmit()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={onCustomSubmit} disabled={!customText.trim()} className="btn-primary text-sm py-1.5 px-3">
                    {strings.customChoiceSubmit}
                  </button>
                  <button onClick={() => { setShowCustomInput(false); setCustomText('') }} className="btn-secondary text-sm py-1.5 px-3">
                    {strings.customChoiceCancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-red-400 text-sm mt-4">{error}</p> : null}
    </section>
  )
}

function ParameterBar({ param }: { param: Parameter }) {
  const maxIdx = param.states.length - 1
  const fill = maxIdx > 0 ? (maxIdx - param.currentStateIndex) / maxIdx : 1
  const isCritical = param.currentStateIndex >= maxIdx

  const barColor = isCritical
    ? '#dc2626'
    : fill > 0.66
      ? '#10b981'
      : fill > 0.33
        ? '#f59e0b'
        : '#f97316'

  return (
    <div className={isCritical ? 'animate-pulse' : ''}>
      <div className="label-caps mb-2 truncate">{param.name}</div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.max(fill * 100, isCritical ? 0 : 3)}%`,
            background: barColor,
          }}
        />
      </div>
      <div className="mt-1.5 text-xs" style={{ color: isCritical ? '#f87171' : 'var(--text-muted)' }}>
        {param.states[param.currentStateIndex]}
      </div>
    </div>
  )
}
