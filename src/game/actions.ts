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
import { LANG_PACKS } from '../i18n/lang-packs'
import {
  applyParameterChanges,
  findBrokenParameters,
  isUnrecoverable,
  markAbilityUsedById,
} from './engine'
import type { Choice, ParameterCost, Story } from './types'

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
      'claude',
    )
    store.setAvailableStories(stories)
  } catch (err) {
    store.setError(t().errorStart(errorMessage(err)))
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
      'gemini',
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
      'gemini',
    )
    state.initStory({
      title: LANG_PACKS[settings.language].sequelTitle,
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

// Called from RoleAssignmentScreen. Assigns secrets and routes to the
// pass-the-phone distribution screen. The actual game start (kickFirstTurn)
// runs after distribution completes.
export function prepareSecretsAndTransition(): void {
  const store = useGameStore.getState()
  store.setError(null)
  store.assignSecrets()
}

// Called from SecretAssignmentScreen when distribution is done.
export async function kickFirstTurn(): Promise<void> {
  const store = useGameStore.getState()
  store.setError(null)
  store.startGame()
  const firstChoice = LANG_PACKS[store.settings.language].gameStartChoice
  await handlePlayerChoice(firstChoice, { isFirstTurn: true })
}

export async function handlePlayerChoice(
  choiceText: string,
  opts: { isFirstTurn?: boolean; isFreeText?: boolean; chosenChoice?: Choice } = {},
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
      recentScenes: store.recentScenes,
      choiceText,
      lastChoiceCost: opts.chosenChoice?.expectedChanges,
      language: store.settings.language,
      context: store.settings.context,
      isFreeText: opts.isFreeText,
    })
    const response = await callAI<TurnResponse>(user, turnSchema, store.settings.provider, system, store.settings.language)

    const strings = translations[store.settings.language]

    if (response.gameOver) {
      // Push the AI's final scene to allScenes before flipping to the gameOver
      // screen — otherwise the "Näita kogu lugu" / copy-transcript output
      // silently misses the last beat of the story.
      if (response.scene && response.scene.trim()) {
        store.pushFinalScene(response.scene)
      }
      store.setGameOver(
        'narrative',
        strings.endNarrative,
        response.gameOverText || strings.endGenericText,
      )
      // Secrets win/loss is computed from the final gameOverKind + parameters.
      // setGameOver just flipped gameOverKind, so scoring reads committed state.
      useGameStore.getState().scoreSecrets()
      return
    }

    // Ability used tracking — read directly from the structured choice.
    const rolesAfterAbility =
      opts.chosenChoice?.isAbility && typeof opts.chosenChoice.actor === 'number'
        ? markAbilityUsedById(store.roles, opts.chosenChoice.actor)
        : store.roles

    const nextTurn = opts.isFirstTurn ? store.currentTurn : store.currentTurn + 1

    // Apply the CHOICE's declared cost authoritatively — not whatever the AI
    // wrote into response.parameters. The choice signed a contract when it
    // was offered (expectedChanges); the engine honours that contract. If we
    // trusted response.parameters, the AI could silently set all deltas to 0
    // (observed: entire games with no parameter movement). Turn 1 and custom
    // free text have no chosenChoice — we fall back to response.parameters
    // there since the AI is the only source of truth.
    const authoritativeChanges: ParameterCost[] =
      opts.chosenChoice?.expectedChanges ?? response.parameters ?? []
    const parametersAfter = applyParameterChanges(store.parameters, authoritativeChanges)

    // Unrecoverable = 2+ parameters at worst. Trigger AI-narrated ending.
    // A single parameter at worst is a phase transition, not a game-over.
    if (isUnrecoverable(parametersAfter)) {
      await narrateUnrecoverableEnd({
        parameters: parametersAfter,
        roles: rolesAfterAbility,
        choiceText,
        nextTurn,
        lastScene: response.scene,
      })
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

// When 2+ parameters collapse, ask the AI for a narrated ending instead of
// ending mechanically with a template string. Falls back to template on error.
async function narrateUnrecoverableEnd(args: {
  parameters: ReturnType<typeof applyParameterChanges>
  roles: ReturnType<typeof markAbilityUsedById>
  choiceText: string
  nextTurn: number
  lastScene: string
}): Promise<void> {
  const store = useGameStore.getState()
  const strings = translations[store.settings.language]
  const { parameters, roles, choiceText, nextTurn, lastScene } = args

  // Push the last normal scene to allScenes — narrateUnrecoverableEnd is
  // called AFTER the turn's scene exists but BEFORE setTurnResult was going
  // to run, so without this the "full story" transcript drops the final
  // pre-collapse beat.
  if (lastScene && lastScene.trim()) {
    store.pushFinalScene(lastScene)
  }

  const recentPlusLast = [...store.recentScenes, lastScene].slice(-3)

  try {
    const { system, user } = turnPrompt({
      currentTurn: nextTurn,
      maxTurns: store.maxTurns,
      genre: store.settings.genre,
      title: store.title,
      summary: store.summary,
      parameters,
      roles,
      recentScenes: recentPlusLast,
      choiceText,
      language: store.settings.language,
      context: store.settings.context,
      forceEnd: 'unrecoverable',
    })
    const endResponse = await callAI<TurnResponse>(
      user,
      turnSchema,
      store.settings.provider,
      system,
      store.settings.language,
    )
    // The forceEnd scene is usually short (the weight is in gameOverText),
    // but when present it's the final on-stage moment — keep it in transcript.
    if (endResponse.scene && endResponse.scene.trim()) {
      store.pushFinalScene(endResponse.scene)
    }
    store.setGameOver(
      'parametric',
      strings.endParametric,
      endResponse.gameOverText ||
        strings.endParametricText(
          findBrokenParameters(parameters)[0].name,
          findBrokenParameters(parameters)[0].states[
            findBrokenParameters(parameters)[0].states.length - 1
          ],
        ),
    )
  } catch {
    // Fallback: hardcoded text (used to be the only path)
    const first = findBrokenParameters(parameters)[0]
    store.setGameOver(
      'parametric',
      strings.endParametric,
      strings.endParametricText(
        first.name,
        first.states[first.states.length - 1],
      ),
    )
  }
  // Either branch ended with setGameOver committing gameOverKind='parametric';
  // now evaluate secrets against final state.
  useGameStore.getState().scoreSecrets()
}
