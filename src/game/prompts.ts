import type { Choice, ContextInput, Language, Parameter, Role } from './types'
import type { JsonSchema } from '../api/adventure'

const langLabel = (lang: Language) => (lang === 'et' ? 'Estonian' : 'English')

function langInstruction(lang: Language): string {
  if (lang === 'et') {
    return 'LANGUAGE: Write all player-facing text in natural Estonian (eesti keel). This is a party game for Estonian adults — use vivid, engaging, colloquial language with its own rhythm and idioms. Do NOT translate from English patterns. Avoid anglicisms. The writing should feel like a native Estonian author, not a translation.'
  }
  return 'LANGUAGE: Write all player-facing text in English.'
}

function buildContextBlock(ctx: ContextInput): string {
  const parts: string[] = []
  if (ctx.location) parts.push(`Physical setting: "${ctx.location}"`)
  if (ctx.playersDesc) parts.push(`People in the group: "${ctx.playersDesc}"`)
  const vibeMap: Record<string, string> = {
    light: 'light & humorous',
    tense: 'tense & serious',
    dark: 'dark & atmospheric',
  }
  if (ctx.vibe) parts.push(`Desired tone: ${vibeMap[ctx.vibe]}`)
  if (ctx.insideJoke) parts.push(`Something that happened today (weave in naturally): "${ctx.insideJoke}"`)
  if (!parts.length) return ''
  return `\nGroup context (weave subtly and naturally into the story — the setting, the people, the mood):\n${parts.map((p) => `- ${p}`).join('\n')}`
}

// ----- Story generation (setup → 3 story options) -----

export const storyGenerationSchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    stories: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          summary: { type: 'STRING' },
          roles: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                description: { type: 'STRING' },
                ability: { type: 'STRING' },
              },
              required: ['name', 'description', 'ability'],
            },
          },
          parameters: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                states: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['name', 'states'],
            },
          },
        },
        required: ['title', 'summary', 'roles', 'parameters'],
      },
    },
  },
  required: ['stories'],
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
  return `${langInstruction(language)}\n\nGenerate 3 adventure stories for ${players} players in the ${genre} genre. Each story should be suitable for a ${duration} duration game. For each story, provide a title, a summary, exactly ${players} unique roles with a name, description, and a single powerful, one-time-use special ability. Also provide THREE unique, story-specific parameters. Each parameter must have a name and exactly 4 states, from best to worst.${contextBlock}`
}

// ----- Custom story from user text -----

export const customStorySchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    roles: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          description: { type: 'STRING' },
          ability: { type: 'STRING' },
        },
        required: ['name', 'description', 'ability'],
      },
    },
    parameters: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          states: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['name', 'states'],
      },
    },
  },
  required: ['roles', 'parameters'],
}

export function customStoryPrompt(args: {
  storyText: string
  players: number
  genre: string
  language: Language
}): string {
  const { storyText, players, genre, language } = args
  return `Based on this custom story idea: "${storyText}", generate ${players} thematically appropriate roles and 3 unique parameters for a ${genre} game. Each role needs a name, description, and a one-time-use ability. Each parameter needs a name and 4 states from best to worst. Output language must be ${langLabel(language)}.`
}

// ----- Sequel generation -----

export const sequelSchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    newAbilities: { type: 'ARRAY', items: { type: 'STRING' } },
    newParameters: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          states: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['name', 'states'],
      },
    },
  },
  required: ['newAbilities', 'newParameters'],
}

export function sequelPrompt(args: {
  sequelText: string
  oldRoles: Pick<Role, 'name' | 'description'>[]
  language: Language
}): string {
  const { sequelText, oldRoles, language } = args
  return `This is a sequel to a previous adventure. The story continues from this summary: "${sequelText}". The returning characters are: ${JSON.stringify(oldRoles)}. Please generate: 1. A new, unique, one-time-use special ability for EACH of the returning characters. The list of abilities must be in the same order as the characters. 2. Three completely new, unique parameters suitable for this sequel story. Each parameter needs a name and 4 states from best to worst. Output language must be ${langLabel(language)}.`
}

// ----- Turn (scene + parameter changes + choices + optional gameOver) -----

export interface TurnResponse {
  scene: string
  parameters: { name: string; change: number }[]
  choices: Choice[]
  gameOver: boolean
  gameOverText?: string
}

export const turnSchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    scene: { type: 'STRING' },
    parameters: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          change: { type: 'INTEGER' },
        },
        required: ['name', 'change'],
      },
    },
    choices: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          text: { type: 'STRING' },
          isAbility: { type: 'BOOLEAN' },
          roleIndex: { type: 'INTEGER' },
        },
        required: ['text', 'isAbility'],
      },
    },
    gameOver: { type: 'BOOLEAN' },
    gameOverText: { type: 'STRING' },
  },
  required: ['scene', 'parameters', 'choices', 'gameOver'],
}

export function turnPrompt(args: {
  currentTurn: number
  maxTurns: number
  duration: string
  genre: string
  parameters: Parameter[]
  roles: Role[]
  choiceText: string
  language: Language
  context: ContextInput
  isFreeText?: boolean
}): string {
  const { currentTurn, maxTurns, duration, genre, parameters, roles, choiceText, language, context, isFreeText } = args
  const availableAbilities = roles
    .filter((r) => !r.used)
    .map((r) => `Role '${r.name}' (index ${r.id}) has ability '${r.ability}' available.`)
    .join(' ')
  const parameterStates = parameters
    .map((p) => `'${p.name}' is '${p.states[p.currentStateIndex]}'`)
    .join(', ')
  const contextBlock = buildContextBlock(context)
  const freeTextRule = isFreeText
    ? ` 7. The players typed a custom action (not one of the preset choices). Interpret it within the current story phase context. If the action would abruptly end the story (e.g., "let's go home" during the climax), offer dramatic in-story consequences instead of literally ending the adventure.`
    : ''

  return `${langInstruction(language)}\n\nThis is turn ${currentTurn} of a ${duration} length ${genre} game.${contextBlock} The current parameter states are: ${parameterStates}. The following special abilities are available: ${availableAbilities || 'None'}. The players chose: "${choiceText}". Continue the story. Strictly follow these rules: 1. The new scene MUST reflect the current parameter states and the player's choice. 2. You MUST change the parameters based on the choice. For each parameter, provide its name and an integer change (-1 for worse, 0 for no change, 1 for better). 3. Provide 2-3 new team-based choices. 4. RARELY, you may offer a choice to use a special ability. If you do, set isAbility to true and provide the roleIndex (0-based) of the role whose ability is being offered. Do NOT offer abilities for roles that are not in the 'availableAbilities' list. 5. Pace the story towards a conclusion. If the turn count (${currentTurn}) is nearing the limit for the game length (${maxTurns}), you MUST start concluding the story. If this is the final turn, set gameOver to true and write a concluding gameOverText. The gameOverText should describe the final outcome and also reflect on the critical choice "${choiceText}" that led the players to this fate.${freeTextRule}`
}
