import type { Choice, ContextInput, Language, Parameter, Role } from './types'
import type { JsonSchema } from '../api/adventure'

const langLabel = (lang: Language) => (lang === 'et' ? 'Estonian' : 'English')

function langInstruction(lang: Language): string {
  if (lang === 'et') {
    return `LANGUAGE: Write all player-facing text in natural Estonian (eesti keel).
CRITICAL: Think and write in Estonian — do NOT translate from English. Avoid anglicised sentence structure.
- Choices MUST be in meie-vormi imperatiiv (we-form): "Avame ukse." / "Ootame varjus." NOT "Te avate ukse."
- Avoid calques: NOT "see on see hea asi X juures, et" → USE "X juures on hea, et"
- Short sentences for action. Flowing sentences for dread. Vary rhythm.
- Use Estonian idioms naturally: "pole muud kui", "mis siis saab", "teeme ära", "käed külge"
- Parameter names: 1-3 words, noun/noun phrase. States: 2-4 words each, no full sentences.`
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
  return `${langInstruction(language)}\n\nGenerate 1 adventure story for ${players} players in the ${genre} genre, suitable for a ${duration} duration game. Provide a compelling title, a vivid summary (2-3 sentences), and exactly ${players} unique roles each with a name, description, and a single powerful one-time-use special ability.

Also design EXACTLY THREE parameters — the mechanical spine of this story. Each MUST be a DIFFERENT archetype:

1. RESOURCE (depletes with action, rarely restored): e.g. "Kütus", "Laskemoon", "Toit", "Aku". Starts full, ends empty. Players spend it to act.
2. BOND (shifts both ways from social/moral choices): e.g. "Usaldus", "Grupi moraal", "Koostöö". Can improve from sacrifice, collapse from betrayal.
3. THREAT (escalates automatically each turn, choices only delay): e.g. "Zombide lähedus", "Ohu kaugus", "Infektsioon". Ticks worse by default; rarely improvable except at climax.

PARAMETER FORMAT:
- name: 1-3 word concrete noun, genre-specific (NOT abstract like "Moraal" alone — use "Grupi moraal" or "Meeste side")
- states: exactly 4 short phrases (2-4 words each), best → worst. Each state must be OBSERVABLE — something a character would SEE or FEEL. Good: "Paak täis", "Paak pooleldi". Bad: "Hea", "Halvasti".

The three parameters must create a TRILEMMA: no single choice can improve all three. Every meaningful decision trades one against another.${contextBlock}`
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
  return `Based on this custom story idea: "${storyText}", generate ${players} thematically appropriate roles and 3 unique parameters for a ${genre} game. Each role needs a name, description, and a one-time-use ability. Parameter format: name = 1-3 word noun; states = 4 short phrases (2-4 words each) from best to worst — no full sentences. Output language must be ${langLabel(language)}.`
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

// ----- Story phase pacing -----

export type StoryPhase = 'setup' | 'inciting' | 'rising' | 'climax' | 'resolution'

export function getStoryPhase(turn: number, maxTurns: number): StoryPhase {
  if (turn <= Math.max(1, Math.round(maxTurns * 0.12))) return 'setup'
  if (turn >= maxTurns) return 'resolution'
  const incitingEnd = Math.max(2, Math.round(maxTurns * 0.30))
  const risingEnd = Math.round(maxTurns * 0.67)
  const climaxEnd = Math.round(maxTurns * 0.87)
  if (turn <= incitingEnd) return 'inciting'
  if (turn <= risingEnd) return 'rising'
  if (turn <= climaxEnd) return 'climax'
  return 'resolution'
}

function phaseInstruction(phase: StoryPhase): string {
  switch (phase) {
    case 'setup':
      return 'PHASE — Setup: Open on a vivid, sensory scene. Introduce each character naturally through the action. End with an ominous hook hinting at conflict ahead. Parameters are stable. Do NOT offer special abilities. Provide exploratory choices.'
    case 'inciting':
      return 'PHASE — Inciting Incident: The central threat enters. Make the stakes concrete — what will be lost if the group fails? At least one parameter begins to shift. Choices feel urgent but not yet desperate. Do NOT offer special abilities yet.'
    case 'rising':
      return 'PHASE — Rising Action: Complications mount. Parameters MUST shift meaningfully (at least one by 1 step). The situation grows harder. Layer in how each character\'s nature shapes the crisis. If abilities are available, a character may rise to their defining moment (isAbility: true) when dramatically earned.'
    case 'climax':
      return 'PHASE — Climax: The crisis peaks — this is the hinge-point. At least one parameter shifts dramatically. If any special ability is still unused, that character MUST step forward NOW — offer it (isAbility: true). Choices feel heavy and irreversible.'
    case 'resolution':
      return 'PHASE — Resolution: The story\'s fate is sealing. Weave threads toward an ending — do not introduce new threats. If this is the final turn, set gameOver: true. Write a conclusion that honors the journey: the specific choices made, who each character became, what happened to this world.'
  }
}

// ----- Turn (scene + parameter changes + choices + optional gameOver) -----

export interface TurnResponse {
  scene: string
  parameters: { name: string; change: number }[]
  choices: Choice[]
  gameOver: boolean
  gameOverText?: string
}


export interface TurnPromptResult {
  system: string
  user: string
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
          expectedChanges: {
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
        },
        required: ['text', 'isAbility', 'expectedChanges'],
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
  genre: string
  title: string
  summary: string
  parameters: Parameter[]
  roles: Role[]
  recentScenes: string[]
  choiceText: string
  language: Language
  context: ContextInput
  isFreeText?: boolean
}): TurnPromptResult {
  const { currentTurn, maxTurns, genre, title, summary, parameters, roles, recentScenes, choiceText, language, context, isFreeText } = args

  const phase = getStoryPhase(currentTurn, maxTurns)
  const contextBlock = buildContextBlock(context)

  const rolesBlock = roles
    .map((r) => `- ${r.name}: ${r.description}. Special ability (one-time): ${r.ability}${r.used ? ' [USED]' : ''}`)
    .join('\n')

  const parametersBlock = parameters
    .map((p) => `- ${p.name}: ${p.states.join(' → ')}`)
    .join('\n')

  const system = `${langInstruction(language)}

You are the narrator for an interactive group storytelling adventure. Players collectively make choices; you narrate the consequences. Your goal: create a genuinely thrilling, immersive story where every choice matters and every turn feels different from the last.

STORY: "${title}"
GENRE: ${genre}
PREMISE: ${summary}${contextBlock}

CHARACTERS:
${rolesBlock}

PARAMETERS (each has 4 states, best → worst):
${parametersBlock}

WRITING STYLE (follow this closely):
${language === 'et'
  ? `Stseen: "Koridor lõpeb raudukse ees. Kuskil seina taga kriibib miski aeglaselt metalli vastu — nagu küüned, kes otsivad pragu. Teie taskulambi valguskiir väriseb, sest käsi, mis seda hoiab, ei suuda enam paigal püsida. Õhk haiseb rooste ja millegi magusalt mädaneva järele."
Valikud: "Avame ukse vaikselt ja vaatame, mis teisel pool on." / "Kustutame lambi ja ootame, kuni heli kaugeneb."`
  : `Scene: "The corridor ends at an iron door. Behind the wall, something scrapes slowly against metal — like fingernails searching for a crack. Your torchlight trembles, because the hand holding it can no longer stay still. The air smells of rust and something sweetly rotting."
Choices: "Open the door quietly and see what's on the other side." / "Kill the light and wait for the sound to fade."`}

CORE RULES:
1. PARAMETERS ARE THE STORY, NOT DECORATION. Every scene MUST show ≥2 parameters as diegetic sensory detail (something a character sees/hears/feels), never as narrator metadata.
   BAD: "Pinge tõuseb."
   GOOD: "Kütusenäidik jõuab punasesse; Mariko käsi väriseb rooli peal." (shows resource + threat)

2. CHOICES MUST DECLARE THEIR COST. Each choice is a TRADE between parameters — write the cost into the choice text itself so players feel the dilemma:
   GOOD: "Murrame tõkke läbi — kulutame kütust, aga jätame jälitajad maha."
   BAD: "Murrame tõkke läbi." (player can't feel the trade-off)
   Fill expectedChanges on each choice to match the cost hinted in the text. These must agree.

3. TRILEMMA ENFORCEMENT. With 3 choices: each must affect a DIFFERENT combination of parameters. Two choices that move the same parameters are a design failure — rewrite one.

4. ARCHETYPE DISCIPLINE:
   - RESOURCE: only worsens or stays. Improves ONLY when a specific item is found/given in the narration.
   - BOND: swings ±1 based on the social/moral content of the chosen action.
   - THREAT: worsens by at least 1 each turn UNLESS the chosen action specifically delays it. Never improves except at climax.

5. parameter.change: +1 = better (index toward best), -1 = worse (index toward worst). Use ±2 ONLY at climax or when a choice is explicitly extreme ("riskime kõigega"). Never ±2 in setup or inciting.

6. FAILURE DRAMATIZATION: If a parameter reaches its worst state, the NEXT scene opens with the narrative consequence — the group lives through the disaster (supplies run out, trust collapses, threat arrives). Do not set gameOver mechanically — dramatize it in the scene.

7. Abilities: offer only in rising or climax, when dramatically earned. isAbility: true + roleIndex (0-based). Never in setup, inciting, resolution.

8. Final turn: set gameOver: true. gameOverText names the parameters that held and those that broke, the choices that mattered, what each character became.

9. Scene length: 2-4 sentences normally, max 5 at climax. Read aloud to a group — dense prose loses the room.

SELF-CHECK before responding:
- Does my scene show ≥2 parameters as concrete sensory details? If not, rewrite.
- Do my 3 choices each touch a DIFFERENT combination of parameters? If two are parameter-twins, rewrite one.
- Does each choice text hint at its cost? If a player can't feel the trade-off from reading the choice, rewrite it.
- Does expectedChanges for each choice match what the choice text promises?`

  const currentStates = parameters
    .map((p) => {
      const stateName = p.states[p.currentStateIndex]
      const step = `${p.currentStateIndex + 1}/4`
      const warning = p.currentStateIndex >= p.states.length - 1 ? ' ⚠ CRITICAL' : ''
      return `- ${p.name}: "${stateName}" (step ${step})${warning}`
    })
    .join('\n')

  const availableAbilities = roles.filter((r) => !r.used)
  const abilitiesLine = availableAbilities.length > 0
    ? `AVAILABLE ABILITIES:\n${availableAbilities.map((r) => `- ${r.name} (roleIndex: ${r.id}): ${r.ability}`).join('\n')}`
    : 'All special abilities have been used.'

  const choiceLine = currentTurn === 1
    ? 'Open the story.'
    : `The players chose: "${choiceText}"`

  const freeTextNote = isFreeText
    ? '\nNOTE: Players typed a custom action. Interpret it within the current phase. If the action would abruptly end the story, offer dramatic in-story consequences instead.'
    : ''

  const langReminder = language === 'et'
    ? 'LANGUAGE REMINDER: Scene and all choices MUST be written in Estonian (eesti keel). Natural, vivid, colloquial — not translated from English.\n\n'
    : ''

  const recentScenesBlock = recentScenes.length > 0
    ? `STORY SO FAR (recent scenes — maintain continuity, reference past events):\n${recentScenes.map((s, i) => `[Scene ${currentTurn - recentScenes.length + i}] ${s}`).join('\n\n')}\n\n`
    : ''

  const user = `TURN ${currentTurn} / ${maxTurns}

${langReminder}${phaseInstruction(phase)}

${recentScenesBlock}CURRENT PARAMETER STATES:
${currentStates}

${abilitiesLine}

${choiceLine}${freeTextNote}`

  return { system, user }
}
