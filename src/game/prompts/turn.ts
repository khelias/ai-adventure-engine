import type { ContextInput, Language, Parameter, Role } from '../types'
import { LANG_PACKS } from '../../i18n/lang-packs'
import { buildToneBlock } from './tone'
import { SCENE_CRAFT, CHOICES_CRAFT, PARAMETER_MOVEMENT, SELF_CHECK } from './craft'
import { TURN_CONTRACT } from './contract'
import { getStoryPhase, phaseInstruction } from './phases'

export interface TurnPromptResult {
  system: string
  user: string
}

function buildContextBlock(ctx: ContextInput): string {
  const parts: string[] = []
  if (ctx.location) parts.push(`- Physical setting: "${ctx.location}"`)
  if (ctx.playersDesc) parts.push(`- People in the group: "${ctx.playersDesc}"`)
  if (ctx.insideJoke) parts.push(`- Something that happened today (weave in naturally): "${ctx.insideJoke}"`)
  if (!parts.length) return ''
  return `\n## GROUP CONTEXT\n\n${parts.join('\n')}\n`
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
  language: Language
  context: ContextInput
  isFreeText?: boolean
  forceEnd?: 'unrecoverable' // set when 2+ params at worst — AI must conclude now
}): TurnPromptResult {
  const {
    currentTurn, maxTurns, genre, title, summary,
    parameters, roles, recentScenes, choiceText, lastChoiceCost,
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
        typeof p.ownerRoleId === 'number' ? `owned by role ${p.ownerRoleId}` : null,
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

  const choiceLine = currentTurn === 1
    ? '## LAST CHOICE\n\n*Open the story.*'
    : `## LAST CHOICE\n\nThe players chose: **"${choiceText}"**`

  const freeTextNote = isFreeText
    ? '\n\n*NOTE: The players typed a custom action. Interpret it within the current phase. If the action would abruptly end the story, offer dramatic in-story consequences instead.*'
    : ''

  const recentScenesBlock = recentScenes.length > 0
    ? `## STORY SO FAR (recent scenes — maintain continuity, reference past events)\n\n${recentScenes.map((s, i) => `**Scene ${currentTurn - recentScenes.length + i}**:\n\n> ${s}`).join('\n\n')}\n`
    : ''

  const forceEndBlock = forceEnd === 'unrecoverable'
    ? `\n## ⚠ FORCED CONCLUSION — UNRECOVERABLE STATE

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
    : ''

  const phaseLine = forceEnd === 'unrecoverable' ? '' : `${phaseInstruction(phase)}\n`

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

${choiceLine}${freeTextNote}`

  return { system, user }
}
