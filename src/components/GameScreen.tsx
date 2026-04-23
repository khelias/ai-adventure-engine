import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { handlePlayerChoice } from '../game/actions'
import type { Choice, Parameter } from '../game/types'
import { LoadingDots } from './LoadingDots'

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
    if (choice.isAbility && choice.actor !== undefined) {
      const role = roles[choice.actor]
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

  const paragraphs = sceneText.split('\n').filter(Boolean)

  return (
    <section>
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar__turn">
          <span className="topbar__turn-num">
            {String(currentTurn).padStart(2, '0')}
          </span>
          <span>/ {String(maxTurns).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Parameters */}
      {parameters.length > 0 && (
        <div className="param-bar">
          {parameters.map((p) => (
            <ParamPill key={p.name} param={p} />
          ))}
        </div>
      )}

      {/* Scene text */}
      <div key={currentTurn} className="space-y-0">
        {isLoading && !sceneText ? (
          <div className="py-10 text-center">
            <LoadingDots />
          </div>
        ) : (
          paragraphs.map((paragraph, i) => (
            <p key={i} className="scene-prose" style={{ marginBottom: i < paragraphs.length - 1 ? '0.85em' : 0 }}>
              {paragraph}
            </p>
          ))
        )}
      </div>

      {/* Choices / turn loading */}
      {choices.length > 0 ? (
        <div className="mt-8">
          {isLoading ? (
            <div className="turn-loading">
              <LoadingDots />
            </div>
          ) : (
            <>
              <div className="ornament-rule type-caps mb-4" style={{ fontSize: '0.6875rem' }}>
                {strings.choiceTitle}
              </div>

              <div>
                {choices.map((choice, i) => {
                  const actorRole =
                    choice.actor !== undefined ? roles[choice.actor] : null
                  const isUsed = choice.isAbility && actorRole ? actorRole.used : false
                  return (
                    <button
                      key={i}
                      onClick={() => onChoice(choice)}
                      disabled={isUsed}
                      className="choice"
                    >
                      <span className="choice__num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="choice__body">
                        {actorRole && (
                          <span className="choice__actor">{actorRole.name}</span>
                        )}
                        <span className="choice__text">
                          {choice.text}{isUsed ? ` — ${strings.usedLabel}` : ''}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Custom input */}
              <div className="mt-4">
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="btn-ghost"
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
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          onCustomSubmit()
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          setShowCustomInput(false)
                          setCustomText('')
                        }
                      }}
                    />
                    <div className="flex gap-3 items-center">
                      <button onClick={onCustomSubmit} disabled={!customText.trim()} className="btn-primary text-xs py-1.5 px-3">
                        {strings.customChoiceSubmit}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCustomInput(false); setCustomText('') }}
                        className="btn-ghost"
                      >
                        {strings.customChoiceCancel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}

      {error ? (
        <p style={{ color: 'var(--state-failing)', fontSize: '0.85rem', marginTop: '1rem' }} className="type-caps">
          {error}
        </p>
      ) : null}
    </section>
  )
}

function paramClass(param: Parameter): string {
  const maxIdx = param.states.length - 1
  if (maxIdx === 0) return 'param-pill--vital'
  const fill = (maxIdx - param.currentStateIndex) / maxIdx
  if (fill > 0.66) return 'param-pill--vital'
  if (fill > 0.33) return 'param-pill--waning'
  return 'param-pill--failing'
}

function ParamPill({ param }: { param: Parameter }) {
  const cls = paramClass(param)
  const filledCount = param.states.length - param.currentStateIndex
  const stateText = param.states[param.currentStateIndex]
  return (
    <div className={`param-pill ${cls}`}>
      <span className="param-pill__name">{param.name}</span>
      <span className="param-pill__dots">
        {param.states.map((_, i) => (
          <span
            key={i}
            className={`param-dot${i < filledCount ? ' param-dot--filled' : ''}`}
          />
        ))}
      </span>
      <span className="param-pill__state">{stateText}</span>
    </div>
  )
}

