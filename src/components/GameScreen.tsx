import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import { handlePlayerChoice } from '../game/actions'
import type { Choice } from '../game/types'

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

  const durationLabel =
    duration === 'Short'
      ? strings.durationShort
      : duration === 'Medium'
        ? strings.durationMedium
        : strings.durationLong

  const onChoice = (choice: Choice) => {
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

  return (
    <section className="space-y-5 max-w-3xl mx-auto">
      <header className="flex justify-between items-center text-sm text-neutral-400">
        <span>
          {strings.turn}: {currentTurn}/{maxTurns}
        </span>
        <span>
          {strings.durationDisplay}: {durationLabel}
        </span>
      </header>

      <div className="card">
        <h3 className="text-sm text-neutral-400 mb-3">{strings.parametersTitle}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {parameters.map((p) => (
            <div key={p.name} className="bg-neutral-950 border border-neutral-800 rounded p-3">
              <div className="text-sm text-neutral-400">{p.name}</div>
              <div className="font-semibold mt-1">
                {p.states[p.currentStateIndex]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-2">
        <h3 className="text-sm text-neutral-400">{strings.sceneTitle}</h3>
        {isLoading && !sceneText ? (
          <p className="text-neutral-500">{strings.loading}</p>
        ) : (
          sceneText
            .split('\n')
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i} className="leading-relaxed">
                {paragraph}
              </p>
            ))
        )}
      </div>

      {!isLoading && choices.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm text-neutral-400">{strings.choiceTitle}</h3>
          <div className="grid gap-2">
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
                  className="btn-secondary text-left"
                >
                  {choice.text}
                  {isUsed ? ` (${strings.usedLabel})` : ''}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {isLoading && sceneText ? (
        <p className="text-neutral-500 text-sm">{strings.loading}</p>
      ) : null}

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
    </section>
  )
}
