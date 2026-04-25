import { callAI } from '../api/adventure'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'
import {
  customStoryPrompt,
  customStorySchema,
  getStoryPhase,
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
import type { Choice, Parameter, ParameterCost, Role, Story } from './types'
import type { TurnRecord } from './transcript'

function t() {
  return translations[useGameStore.getState().settings.language]
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

// Build a single turn record for the transcript. Each AI call (kickoff,
// regular turn, narrative-final, unrecoverable retry) produces exactly one
// record. The transcript is rebuilt at game-end into a single JSON document.
function buildTurnRecord(args: {
  turn: number
  maxTurns: number
  triggeredBy: TurnRecord['triggeredBy']
  response: TurnResponse
  appliedChanges: ParameterCost[]
  parametersAfter: Parameter[]
  rolesAfter: Role[]
  forceEnd?: TurnRecord['forceEnd']
}): TurnRecord {
  return {
    turn: args.turn,
    phase: getStoryPhase(args.turn, args.maxTurns),
    triggeredBy: args.triggeredBy,
    scene: args.response.scene,
    choicesOffered: args.response.choices ?? [],
    appliedChanges: args.appliedChanges,
    aiClaimedChanges: args.response.parameters ?? [],
    parametersAfter: args.parametersAfter,
    rolesAfter: args.rolesAfter,
    forceEnd: args.forceEnd,
  }
}

function describeTrigger(args: {
  isFirstTurn?: boolean
  isFreeText?: boolean
  chosenChoice?: Choice
  choiceText: string
}): TurnRecord['triggeredBy'] {
  if (args.isFirstTurn) return { kind: 'kickoff' }
  if (args.isFreeText) return { kind: 'free-text', text: args.choiceText }
  if (args.chosenChoice) {
    return {
      kind: 'option',
      choiceText: args.choiceText,
      chosenChoice: args.chosenChoice,
    }
  }
  // Defensive — shouldn't happen given the call sites, but record it cleanly.
  return { kind: 'free-text', text: args.choiceText }
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
    const strings = translations[store.settings.language]

    // Off-by-one fix: the AI is writing the scene the player is ABOUT to see,
    // not the one already on screen. Sending stale store.currentTurn made the
    // prompt header lag one turn behind reality — for Short=8 the AI was told
    // "TURN 7 / 8" when generating the 8th scene, so it never read its own
    // header as "final turn" and never ended.
    const upcomingTurn = opts.isFirstTurn
      ? store.currentTurn
      : store.currentTurn + 1
    const isFinalTurn = upcomingTurn >= store.maxTurns

    // Ability used tracking — read directly from the structured choice. We
    // mark the ability used BEFORE calling the AI so the prompt's AVAILABLE
    // ABILITIES block doesn't silently re-offer the ability the player just
    // used (observed: same one-time-use ability shown twice in adjacent turns).
    let abilityActorId = opts.chosenChoice?.isAbility ? opts.chosenChoice.actor : null
    // Fallback: if AI flagged isAbility=true but omitted the actor, try to find
    // which role's ability matches the choice text to ensure it gets marked used.
    if (opts.chosenChoice?.isAbility && typeof abilityActorId !== 'number') {
      const match = store.roles.find(r => opts.chosenChoice!.text.includes(r.name) || opts.chosenChoice!.text.includes(r.ability))
      if (match) abilityActorId = match.id
    }

    const rolesAfterAbility =
      typeof abilityActorId === 'number'
        ? markAbilityUsedById(store.roles, abilityActorId)
        : store.roles

    // For chosenChoice turns we know the deltas upfront — preview the
    // post-apply state and pass it to the AI as "current parameter states".
    // Without this, the prompt was self-contradictory: states block showed
    // pre-apply values while the APPLIED CHANGES block claimed they "already
    // reflect" the deltas. AI got contradictory information. For kickoff /
    // free-text we can't preview (deltas come from the AI's own response),
    // so we fall back to pre-apply and finalize after the call.
    const choiceDeltas: ParameterCost[] =
      opts.chosenChoice?.expectedChanges ?? []
    const paramsForPrompt = opts.chosenChoice
      ? applyParameterChanges(store.parameters, choiceDeltas)
      : store.parameters

    const { system, user } = turnPrompt({
      currentTurn: upcomingTurn,
      maxTurns: store.maxTurns,
      genre: store.settings.genre,
      title: store.title,
      summary: store.summary,
      parameters: paramsForPrompt,
      roles: rolesAfterAbility,
      recentScenes: store.recentScenes,
      choiceText,
      lastChoiceCost: opts.chosenChoice?.expectedChanges,
      lastTurnChoices: store.lastTurnChoices,
      language: store.settings.language,
      context: store.settings.context,
      isFreeText: opts.isFreeText,
      // Final-turn forceEnd is sent PROACTIVELY (not as a retry like
      // 'unrecoverable') because we know upfront which turn the story ends on.
      // This guarantees the natural-pacing ending lands on time.
      forceEnd: isFinalTurn ? 'narrative-final' : undefined,
    })
    const response = await callAI<TurnResponse>(user, turnSchema, store.settings.provider, system, store.settings.language)

    // Authoritative deltas: chosenChoice.expectedChanges when we have a
    // structured pick (the contract the choice signed when it was offered),
    // otherwise the AI's response.parameters for kickoff / free-text.
    // Trusting response.parameters on chosenChoice turns is unsafe — the AI
    // sometimes silently zeroes them out, which produced parameter-frozen
    // playthroughs in the past.
    const authoritativeChanges: ParameterCost[] =
      opts.chosenChoice?.expectedChanges ?? response.parameters ?? []
    const parametersAfter = opts.chosenChoice
      ? paramsForPrompt
      : applyParameterChanges(store.parameters, authoritativeChanges)

    const triggeredBy = describeTrigger({
      isFirstTurn: opts.isFirstTurn,
      isFreeText: opts.isFreeText,
      chosenChoice: opts.chosenChoice,
      choiceText,
    })

    // Narrative end path:
    //   - isFinalTurn=true: forceEnd='narrative-final' was sent. Engine
    //     guarantees the end here even if AI ignored forceEnd (response.scene
    //     becomes the closing beat, fallback gameOverText if AI didn't write one).
    //   - response.gameOver=true: AI volunteered a mid-game ending (shape B).
    if (isFinalTurn || response.gameOver) {
      if (response.scene && response.scene.trim()) {
        store.pushFinalScene(response.scene)
      }
      // Commit applied changes before setGameOver so the gameOver screen,
      // secrets scoring, and the persisted transcript see the FINAL state.
      // (Previously we ended without applying, so the "final parameters"
      // captured in the gameOver screen lagged one choice behind.)
      useGameStore.setState({
        parameters: parametersAfter,
        roles: rolesAfterAbility,
      })
      store.appendTurnRecord(
        buildTurnRecord({
          turn: upcomingTurn,
          maxTurns: store.maxTurns,
          triggeredBy,
          response,
          appliedChanges: authoritativeChanges,
          parametersAfter,
          rolesAfter: rolesAfterAbility,
          forceEnd: isFinalTurn ? 'narrative-final' : undefined,
        }),
      )
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

    // Unrecoverable = 2+ parameters at worst. Trigger AI-narrated ending.
    // A single parameter at worst is a phase transition, not a game-over.
    if (isUnrecoverable(parametersAfter)) {
      // Record the regular turn that produced the collapse, BEFORE running
      // the unrecoverable retry. narrateUnrecoverableEnd appends its own
      // record for the second AI call.
      store.appendTurnRecord(
        buildTurnRecord({
          turn: upcomingTurn,
          maxTurns: store.maxTurns,
          triggeredBy,
          response,
          appliedChanges: authoritativeChanges,
          parametersAfter,
          rolesAfter: rolesAfterAbility,
        }),
      )
      await narrateUnrecoverableEnd({
        parameters: parametersAfter,
        roles: rolesAfterAbility,
        choiceText,
        nextTurn: upcomingTurn,
        lastScene: response.scene,
      })
      return
    }

    store.appendTurnRecord(
      buildTurnRecord({
        turn: upcomingTurn,
        maxTurns: store.maxTurns,
        triggeredBy,
        response,
        appliedChanges: authoritativeChanges,
        parametersAfter,
        rolesAfter: rolesAfterAbility,
      }),
    )
    store.setTurnResult({
      sceneText: response.scene,
      choices: response.choices,
      parameters: parametersAfter,
      roles: rolesAfterAbility,
      currentTurn: upcomingTurn,
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

  // Commit the post-apply (collapsed) state to the store before any setGameOver
  // path. Otherwise the gameOver screen, secrets scoring, and persisted
  // transcript would see pre-collapse parameters — the very deltas that
  // triggered the parametric end wouldn't appear in finalParameters.
  useGameStore.setState({ parameters, roles })

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
    // Append the unrecoverable retry as its own turn record. No new deltas
    // are applied here — the collapse was applied by the regular turn that
    // preceded this retry; this AI call only writes the closing beat.
    store.appendTurnRecord(
      buildTurnRecord({
        turn: nextTurn,
        maxTurns: store.maxTurns,
        triggeredBy: {
          kind: 'engine-retry',
          reason: 'unrecoverable',
          lastChoiceText: choiceText,
        },
        response: endResponse,
        appliedChanges: [],
        parametersAfter: parameters,
        rolesAfter: roles,
        forceEnd: 'unrecoverable',
      }),
    )
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
