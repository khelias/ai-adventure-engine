import type { ContextInput, Language, Role } from '../types'
import { LANG_PACKS } from '../../i18n/lang-packs'
import { buildToneBlock } from './tone'
import { ARCHETYPE_PALETTE, PARAMETER_CRAFT } from './archetypes'

function buildContextBlock(ctx: ContextInput): string {
  const structural: string[] = []
  if (ctx.location) structural.push(`- Physical setting: "${ctx.location}"`)
  if (ctx.playersDesc) structural.push(`- People in the group: "${ctx.playersDesc}"`)

  const hasStructural = structural.length > 0
  const hasJoke = !!ctx.insideJoke
  if (!hasStructural && !hasJoke) return ''

  const parts: string[] = ['\n## GROUP CONTEXT\n']
  if (hasStructural) {
    parts.push(
      'Story-shaping inputs — fold these into the setting, the people, the mood.\n',
    )
    parts.push(structural.join('\n') + '\n')
  }
  if (hasJoke) {
    parts.push(`### SCENE EASTER EGG (flavor only, NOT story structure)

A small in-joke from the group's day: "${ctx.insideJoke}"

This is decoration, not material. It MUST NOT appear in:
- the title or summary
- any parameter (name, archetype, or state phrase)
- any role (name, description, or ability)

The genre and the player count drive the story's bones. Build those
first as if this easter egg did not exist. The narrator may reference
it lightly later as a passing scene-level wink — but the story must
stand on its own without it.\n`)
  }
  return parts.join('\n')
}

export function storyGenerationPrompt(args: {
  players: number
  genre: string
  duration: string
  language: Language
  context: ContextInput
}): string {
  const { players, genre, duration, language, context } = args
  const contextBlock = buildContextBlock(context)
  const toneBlock = buildToneBlock(context.vibe)
  return `${LANG_PACKS[language].instruction}
${toneBlock}
## TASK

Generate one adventure story for ${players} players in the ${genre}
genre, suitable for a ${duration} duration game. Provide a compelling
title, a vivid 2–3 sentence summary, and exactly ${players} unique roles.

The summary and the initial scene MUST already embody the TONE above if
one was provided — a 'light' story opens with a ridiculous human detail,
a 'dark' story opens with dread, a 'tense' story opens with measured
pressure.

## ROLES

- \`name\` is a PROPER FIRST NAME appropriate to the target language — not
  a job title, not a description. Just a single first name.
- \`description\` is one sentence describing who this person is and their
  relevant skill or background.
- \`ability\` is a single powerful one-time-use special ability. Name it
  clearly and say what it does.

${ARCHETYPE_PALETTE}

${PARAMETER_CRAFT}

The three parameters must create a TRILEMMA: no single choice can improve
all three. Every meaningful decision trades one against another.
${contextBlock}`
}

export function customStoryPrompt(args: {
  storyText: string
  players: number
  genre: string
  language: Language
}): string {
  const { storyText, players, genre, language } = args
  return `${LANG_PACKS[language].instruction}

## TASK

Based on this custom story idea: "${storyText}", generate ${players}
thematically appropriate roles and 3 unique parameters for a ${genre} game.

Each role needs a PROPER FIRST NAME (not a title), a one-sentence
description, and a one-time-use ability.

${ARCHETYPE_PALETTE}

${PARAMETER_CRAFT}

Output language must be ${LANG_PACKS[language].label}.`
}

export function sequelPrompt(args: {
  sequelText: string
  oldRoles: Pick<Role, 'name' | 'description'>[]
  language: Language
}): string {
  const { sequelText, oldRoles, language } = args
  return `${LANG_PACKS[language].instruction}

## TASK — SEQUEL

This is a sequel to a previous adventure. The story continues from this
summary: "${sequelText}".

The returning characters are: ${JSON.stringify(oldRoles)}.

Generate:

1. A new, unique, one-time-use special ability for EACH returning
   character. The list of abilities must be in the same order as the
   characters above.
2. Three completely new, unique parameters suitable for this sequel
   story.

${ARCHETYPE_PALETTE}

${PARAMETER_CRAFT}

Prefer a DIFFERENT archetype mix from the first adventure —
continuations feel fresh when the mechanical shape evolves.

Output language must be ${LANG_PACKS[language].label}.`
}
