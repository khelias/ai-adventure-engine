import type { Choice, ContextInput, Language, Parameter, Role } from '../types'
import { LANG_PACKS } from '../../i18n/lang-packs'
import { buildToneBlock } from './tone'
import { SCENE_CRAFT, CHOICES_CRAFT, PARAMETER_MOVEMENT, SELF_CHECK } from './craft'
import { TURN_CONTRACT } from './contract'
import { ARCHETYPE_BEHAVIORS } from './archetypes'
import { getStoryPhase, phaseInstruction } from './phases'

export interface TurnPromptResult {
  system: string
  user: string
}

function buildContextBlock(ctx: ContextInput): string {
  const structural: string[] = []
  if (ctx.location) structural.push(`- Physical setting: "${ctx.location}"`)
  if (ctx.playersDesc) structural.push(`- People in the group: "${ctx.playersDesc}"`)

  const hasStructural = structural.length > 0
  const hasJoke = !!ctx.insideJoke
  if (!hasStructural && !hasJoke) return ''

  const parts: string[] = ['\n## GROUP CONTEXT\n']
  if (hasStructural) {
    parts.push(structural.join('\n') + '\n')
  }
  if (hasJoke) {
    parts.push(`### SCENE EASTER EGG (use lightly, never as story driver)

A small in-joke from the group's day: "${ctx.insideJoke}"

It can earn at most one passing reference per scene, only when the
moment naturally invites it. Skip it entirely if it would not fit
this scene's tone — most scenes will not include it. Never let it
shape choices, parameter movement, or the threat. It is a wink, not
a hinge.\n`)
  }
  return parts.join('\n')
}

export function turnPrompt(args: {
  currentTurn: number
  maxTurns: number
  genre: string
  title: string
  summary: string
  parameters: Parameter[]
  roles: Role[]
  recentScenes: string[]
  choiceText: string
  // The declared cost of the choice the players just picked. Engine applies
  // this directly; we pass it to the AI so the scene it writes NEXT visibly
  // embodies exactly these deltas rather than inventing new ones.
  lastChoiceCost?: { name: string; change: number }[]
  // The full set of choices the AI offered on the previous turn (the set
  // the players just picked from). Surfaced so the AI can see the shape
  // it just used and avoid paraphrasing it on this turn.
  lastTurnChoices?: Choice[]
  language: Language
  context: ContextInput
  isFreeText?: boolean
  // 'unrecoverable': 2+ params at worst — AI must conclude now (parametric end).
  // 'narrative-final': we're on the FINAL turn (currentTurn === maxTurns) —
  // AI must wrap the story arc as planned, regardless of phase reading.
  forceEnd?: 'unrecoverable' | 'narrative-final'
}): TurnPromptResult {
  const {
    currentTurn, maxTurns, genre, title, summary,
    parameters, roles, recentScenes, choiceText, lastChoiceCost,
    lastTurnChoices,
    language, context, isFreeText, forceEnd,
  } = args

  const phase = getStoryPhase(currentTurn, maxTurns)
  const contextBlock = buildContextBlock(context)
  const toneBlock = buildToneBlock(context.vibe)
  const pack = LANG_PACKS[language]
  const exampleBlock = pack.fewShotExample ? `\n## EXAMPLE TURN\n\n${pack.fewShotExample}\n` : ''

  const rolesBlock = roles
    .map((r) => `- \`roleIndex ${r.id}\` **${r.name}** — ${r.description}. Special ability (one-time): *${r.ability}*${r.used ? ' [USED]' : ''}`)
    .join('\n')

  const parametersBlock = parameters
    .map((p) => {
      const meta = [
        p.archetype ? `archetype=${p.archetype}` : null,
      ].filter(Boolean).join(', ')
      const metaStr = meta ? ` *(${meta})*` : ''
      return `- **${p.name}**${metaStr}: ${p.states.join(' → ')}`
    })
    .join('\n')

  // ---- SYSTEM PROMPT ----
  //
  // Structure: role → story & characters → craft (scene/choices/parameter)
  // → contract → phase → tone → self-check → few-shot. Pure craft; no
  // meta-talk about the game client.
  const system = `${pack.instruction}
${toneBlock}
## ROLE

You are the narrator for an interactive group storytelling adventure
played aloud at a table. Players collectively make choices; you narrate
the consequences. Your goal is a genuinely thrilling story where every
choice matters.

## STORY

**${title}**

*${summary}*

Genre: ${genre}
${contextBlock}
## CHARACTERS

${rolesBlock}

## PARAMETERS

Each has 4 states, best → worst.

${parametersBlock}

${ARCHETYPE_BEHAVIORS}

${SCENE_CRAFT}

${CHOICES_CRAFT}

${PARAMETER_MOVEMENT}

${TURN_CONTRACT}

${SELF_CHECK}${exampleBlock}`

  // ---- USER MESSAGE ----

  const currentStates = parameters
    .map((p) => {
      const stateName = p.states[p.currentStateIndex]
      const step = `${p.currentStateIndex + 1}/${p.states.length}`
      let marker = ''
      if (p.justBroke) marker = ' **⚠ JUST HIT WORST** — open THIS scene with the consequence of this collapse'
      else if (p.currentStateIndex >= p.states.length - 1) marker = ' *(still at worst state)*'
      else if (p.currentStateIndex === p.states.length - 2) marker = ' *(near worst — one step from collapse)*'
      return `- **${p.name}**: "${stateName}" *(step ${step})*${marker}`
    })
    .join('\n')

  const availableAbilities = roles.filter((r) => !r.used)
  const abilitiesLine = availableAbilities.length > 0
    ? `## AVAILABLE ABILITIES\n\n${availableAbilities.map((r) => `- **${r.name}** (actor: ${r.id}) — *${r.ability}*`).join('\n')}`
    : '*All special abilities have been used.*'

  // Render the previous turn's offered set so the AI can see its own last
  // choice-shape and explicitly differ from it. Skipped on turn 1 (nothing
  // was offered yet) and on free-text turns (the prior choices weren't the
  // input — the player typed something).
  const lastTurnChoicesBlock =
    lastTurnChoices && lastTurnChoices.length > 0 && !isFreeText
      ? `## PREVIOUS TURN'S OFFERED CHOICES

You wrote these three choices last turn. The players picked one (see
**LAST CHOICE** below). Do NOT paraphrase this shape on this turn —
the situation must have transformed, not merely repeated with new
words. Different actors, different stakes, different verbs.

${lastTurnChoices
  .map((c, i) => {
    const actorName = typeof c.actor === 'number' ? (roles[c.actor]?.name ?? `role ${c.actor}`) : 'The group'
    const costSummary = c.expectedChanges
      .filter((e) => e.change !== 0)
      .map((e) => `${e.name} ${e.change > 0 ? '+' : ''}${e.change}`)
      .join(', ')
    return `${i + 1}. **${actorName}** — "${c.text}"${costSummary ? ` *(cost: ${costSummary})*` : ''}`
  })
  .join('\n')}
`
      : ''

  const choiceLine = currentTurn === 1
    ? '## LAST CHOICE\n\n*Open the story.*'
    : `## LAST CHOICE\n\nThe players chose: **"${choiceText}"**`

  const freeTextNote = isFreeText
    ? '\n\n*NOTE: The players typed a custom action. Interpret it within the current phase. If the action would abruptly end the story, offer dramatic in-story consequences instead.*'
    : ''

  const recentScenesBlock = recentScenes.length > 0
    ? `## STORY SO FAR (recent scenes — maintain continuity, reference past events)\n\n${recentScenes.map((s, i) => `**Scene ${currentTurn - recentScenes.length + i}**:\n\n> ${s}`).join('\n\n')}\n`
    : ''

  let forceEndBlock = ''
  if (forceEnd === 'unrecoverable') {
    forceEndBlock = `\n## ⚠ FORCED CONCLUSION — UNRECOVERABLE STATE

Two or more parameters have collapsed to worst state simultaneously. The
situation is unrecoverable.

Write the final scene NOW:

- Set \`gameOver: true\`.
- Write a full \`gameOverText\` (3–5 paragraphs) that names which
  parameters held and which broke, the key choices that led here, and
  what happened to each character. Honor the journey — this is the
  group's ending.
- The \`scene\` field can be short — the \`gameOverText\` carries the weight.
- Output empty \`choices\`.\n`
  } else if (forceEnd === 'narrative-final') {
    forceEndBlock = `\n## ⚠ FORCED CONCLUSION — FINAL TURN

This is the final turn of the story (\`TURN ${currentTurn} / ${maxTurns}\`).
The arc ends here. There is no next turn to defer to.

Write the ending NOW:

- Set \`gameOver: true\`.
- Write a full \`gameOverText\` (3–5 paragraphs) that names which
  parameters held and which broke, the specific choices that mattered
  along the way, and what each named character became. This is the
  group's ending — honor the journey, do not narrate around it.
- The \`scene\` field can be short — \`gameOverText\` carries the weight.
- Output empty \`choices\`.

**CRITICAL RULE**: You MUST strictly read the \`currentStateIndex\` and text of
all parameters before writing the \`gameOverText\`. If threats are low (e.g.,
index 0 or 1), the ending MUST be safe/triumphant. Tragic endings are ONLY
allowed if parameters have actually collapsed to their worst states.

The story does NOT continue. Do not offer choices. Do not set
\`gameOver: false\`. There is exactly one valid response shape on this
turn: gameOver=true with a written ending.\n`
  }

  const phaseLine = forceEnd ? '' : `${phaseInstruction(phase)}\n`

  const appliedChangesBlock = lastChoiceCost && lastChoiceCost.length > 0
    ? `## APPLIED CHANGES

The engine already applied these deltas from the players' last choice.
Current parameter states above already reflect them. Your scene MUST
show the consequences visibly.

${lastChoiceCost
  .filter((c) => c.change !== 0)
  .map((c) => `- **${c.name}**: ${c.change > 0 ? '+' : ''}${c.change}`)
  .join('\n')}
`
    : ''

  const user = `# TURN ${currentTurn} / ${maxTurns}

${pack.turnReminder}${phaseLine}${forceEndBlock}
${recentScenesBlock}
## CURRENT PARAMETER STATES

${currentStates}

${appliedChangesBlock}${abilitiesLine}

${lastTurnChoicesBlock}${choiceLine}${freeTextNote}`

  return { system, user }
}
