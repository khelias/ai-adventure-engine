import { callAI } from '../api/adventure'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import {
  customStoryPrompt,
  customStorySchema,
  sequelPrompt,
  sequelSchema,
  storyGenerationPrompt,
  storyGenerationSchema,
  turnPrompt,
  turnSchema,
  type TurnResponse,
} from './prompts'
import {
  applyParameterChanges,
  findCriticalParameter,
  isAbilityChoice,
  markAbilityUsed,
} from './engine'
import type { Story } from './types'

function t() {
  return translations[useGameStore.getState().settings.language]
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export async function generateStories(): Promise<void> {
  const { settings } = useGameStore.getState()
  const store = useGameStore.getState()
  store.setError(null)
  store.setLoading(true)
  try {
    const { stories } = await callAI<{ stories: Story[] }>(
      storyGenerationPrompt({
        players: settings.players,
        genre: settings.genre,
        duration: settings.duration,
        language: settings.language,
        context: settings.context,
      }),
      storyGenerationSchema,
      settings.provider,
    )
    store.setAvailableStories(stories)
  } catch (err) {
    store.setError(errorMessage(err))
  } finally {
    store.setLoading(false)
  }
}

export async function generateCustomStory(storyText: string): Promise<void> {
  if (!storyText.trim()) return
  const { settings } = useGameStore.getState()
  const store = useGameStore.getState()
  store.setError(null)
  store.setLoading(true)
  try {
    const response = await callAI<Pick<Story, 'roles' | 'parameters'>>(
      customStoryPrompt({
        storyText,
        players: settings.players,
        genre: settings.genre,
        language: settings.language,
      }),
      customStorySchema,
      settings.provider,
    )
    const title = t().customStoryTitle.replace('...', '')
    store.initStory({
      title,
      summary: storyText,
      roles: response.roles,
      parameters: response.parameters,
    })
  } catch (err) {
    store.setError(t().errorCustom(errorMessage(err)))
  } finally {
    store.setLoading(false)
  }
}

export async function generateSequel(sequelText: string): Promise<void> {
  const state = useGameStore.getState()
  const { settings, roles: oldRoles } = state
  state.setError(null)
  state.setLoading(true)
  try {
    const response = await callAI<{
      newAbilities: string[]
      newParameters: Story['parameters']
    }>(
      sequelPrompt({
        sequelText,
        oldRoles: oldRoles.map((r) => ({ name: r.name, description: r.description })),
        language: settings.language,
      }),
      sequelSchema,
      settings.provider,
    )
    state.initStory({
      title: settings.language === 'et' ? 'Järjelugu' : 'Sequel',
      summary: sequelText,
      roles: oldRoles.map((role, index) => ({
        name: role.name,
        description: role.description,
        ability: response.newAbilities[index] || 'New Ability',
      })),
      parameters: response.newParameters,
    })
  } catch (err) {
    state.setError(t().errorSequel(errorMessage(err)))
  } finally {
    state.setLoading(false)
  }
}

export async function startGameAndFirstTurn(): Promise<void> {
  const store = useGameStore.getState()
  store.setError(null)
  store.startGame()
  const firstChoice = store.settings.language === 'et' ? 'Mäng algab.' : 'The game begins.'
  await handlePlayerChoice(firstChoice, { isFirstTurn: true })
}

export async function handlePlayerChoice(
  choiceText: string,
  opts: { isFirstTurn?: boolean; isFreeText?: boolean } = {},
): Promise<void> {
  const store = useGameStore.getState()
  store.setError(null)
  store.setLoading(true)

  try {
    const { system, user } = turnPrompt({
      currentTurn: store.currentTurn,
      maxTurns: store.maxTurns,
      genre: store.settings.genre,
      title: store.title,
      summary: store.summary,
      parameters: store.parameters,
      roles: store.roles,
      choiceText,
      language: store.settings.language,
      context: store.settings.context,
      isFreeText: opts.isFreeText,
    })
    const response = await callAI<TurnResponse>(user, turnSchema, store.settings.provider, system)

    const strings = translations[store.settings.language]

    if (response.gameOver) {
      store.setGameOver(
        'narrative',
        strings.endNarrative,
        response.gameOverText || strings.endGenericText,
      )
      return
    }

    // Ability used tracking — mirror V1 behaviour.
    const rolesAfterAbility = isAbilityChoice(choiceText)
      ? markAbilityUsed(store.roles, choiceText)
      : store.roles

    const nextTurn = opts.isFirstTurn ? store.currentTurn : store.currentTurn + 1
    const parametersAfter = applyParameterChanges(store.parameters, response.parameters)

    const critical = findCriticalParameter(parametersAfter)
    if (critical) {
      store.setGameOver(
        'parametric',
        strings.endParametric,
        strings.endParametricText(
          critical.name,
          critical.states[critical.states.length - 1],
        ),
      )
      return
    }

    store.setTurnResult({
      sceneText: response.scene,
      choices: response.choices,
      parameters: parametersAfter,
      roles: rolesAfterAbility,
      currentTurn: nextTurn,
    })
  } catch (err) {
    store.setError(t().errorApi(errorMessage(err)))
  } finally {
    store.setLoading(false)
  }
}
