import type { Choice, ContextInput, Language, Parameter, Role } from './types'
import type { JsonSchema } from '../api/adventure'

const langLabel = (lang: Language) => (lang === 'et' ? 'Estonian' : 'English')

function langInstruction(lang: Language): string {
  if (lang === 'et') {
    return `LANGUAGE: Write all player-facing text in natural, native-level Estonian (eesti keel).
- Think and write in Estonian. Do NOT translate from English. Avoid anglicised sentence structure.
- Choices MUST be in kolmandas isikus — name the acting character as the grammatical subject: "Mari avab ukse vaikselt." / "Jaan kustutab lambi ja ootab." / "Karin koputab uksele." NEVER meie-vorm ("Avame ukse"), NEVER teie-vorm ("Te avate ukse"), NEVER abstract "Grupp otsustab".
- Parameter names: 1-3 words, noun/noun phrase. States: 2-4 words each, no full sentences.
- Character names (role.name) MUST be proper Estonian first names (e.g. Mari, Jaan, Karin, Mattis) — NOT job titles. Put the profession/role in role.description.
- Prefer simple, common words over rare compounds. If unsure whether a compound exists, use two separate words instead.`
  }
  return `LANGUAGE: Write all player-facing text in English.
- Choices MUST be in third person with the acting character as the subject: "Mari opens the door." / "Jaan kills the light and waits." NEVER "We open the door." NEVER "The group decides".`
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

// ----- Story generation (setup → 1 story) -----

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
  return `${langInstruction(language)}

Generate 1 adventure story for ${players} players in the ${genre} genre, suitable for a ${duration} duration game. Provide a compelling title, a vivid summary (2-3 sentences), and exactly ${players} unique roles.

ROLES:
- role.name: a PROPER FIRST NAME (e.g. "Mari", "Karin", "Mattis") — NOT a job title, NOT a description. Just a single first name.
- role.description: one sentence describing who this person is and their relevant skill/background.
- role.ability: a single powerful one-time-use special ability. Clearly name the ability and what it does.

Design EXACTLY THREE parameters — the mechanical spine of this story. Each MUST be a DIFFERENT archetype:

1. RESOURCE (depletes with action, rarely restored): e.g. "Kütus", "Laskemoon", "Toit", "Aku". Starts full, ends empty. Players spend it to act.
2. BOND (shifts both ways from social/moral choices): e.g. "Usaldus", "Grupi side", "Koostöö". Can improve from sacrifice, collapse from betrayal. Use gender-neutral framing ("Grupi side" not "Meeste side").
3. PRESSURE (escalates from events in the story): e.g. "Zombide surve", "Ohu lähedus", "Infektsioon". Only the AI's choice costs determine when this changes — there is no hidden per-turn automatic worsening.

PARAMETER FORMAT:
- name: 1-3 word concrete noun, genre-specific (NOT abstract like "Moraal" alone — use "Grupi moraal")
- states: exactly 4 short phrases (2-4 words each), best → worst. Each state must be OBSERVABLE — something a character would SEE or FEEL. Good: "Paak täis", "Paak pooleldi". Bad: "Hea", "Halvasti".
- Double-check word order of every state phrase — in Estonian "Pinged pinna all" is correct, "Pinged all pinna" is wrong.

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
  return `Based on this custom story idea: "${storyText}", generate ${players} thematically appropriate roles and 3 unique parameters for a ${genre} game. Each role needs a PROPER FIRST NAME (not a title), description, and a one-time-use ability. Parameter format: name = 1-3 word noun; states = 4 short phrases (2-4 words each) from best to worst — no full sentences. Output language must be ${langLabel(language)}.`
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
          actor: { type: 'INTEGER' },
          target: { type: 'INTEGER' },
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
        required: ['text', 'isAbility', 'actor', 'expectedChanges'],
      },
    },
    gameOver: { type: 'BOOLEAN' },
    gameOverText: { type: 'STRING' },
  },
  required: ['scene', 'parameters', 'choices', 'gameOver'],
}

const ESTONIAN_EXAMPLE = `EXAMPLE OF A GOOD TURN (match this style — especially scene length, sentence rhythm, and how each choice names a specific character as actor):

Scene:
"Koridor lõpeb raudukse ees. Midagi kriibib seina taga metalli vastu — aeglaselt, nagu küüned, kes otsivad pragu. Mari taskulamp väriseb; ta hoiab seda kahe käega, aga käed ise ei pea."

Choices (assume roles: 0=Mari, 1=Jaan, 2=Karin):
- { text: "Mari avab ukse vaikselt ja astub esimesena ette.", actor: 0, expectedChanges: [{name:"Grupi side", change:+1}, {name:"Zombide surve", change:-1}] }
  → courage axis: Mari takes the risk herself, shielding the others.
- { text: "Jaan kustutab lambi ja jätab Mari pimedusse ukse ette.", actor: 1, target: 0, expectedChanges: [{name:"Grupi side", change:-1}, {name:"Zombide surve", change:+1}] }
  → loyalty axis: Jaan sacrifices Mari's position for the group's concealment. Target is Mari.
- { text: "Karin tunnistab kõigile, et kuulis seda häält juba pool tundi tagasi.", actor: 2, expectedChanges: [{name:"Grupi side", change:-1}, {name:"Kütus", change:+0}, {name:"Zombide surve", change:-1}] }
  → truth axis: Karin reveals withheld information — group trust drops, but the threat is newly understood.

Note: 3 sentences total in the scene. Each choice names one character as grammatical subject AND sets actor. The three choices test three different moral axes (courage / loyalty / truth), not three variants of the same question. Numeric costs stay in expectedChanges — the choice TEXT does not spell numbers, but the action implies the cost clearly.`

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
  forceEnd?: 'unrecoverable' // set when 2+ params at worst — AI must conclude now
}): TurnPromptResult {
  const {
    currentTurn, maxTurns, genre, title, summary,
    parameters, roles, recentScenes, choiceText, language, context, isFreeText, forceEnd,
  } = args

  const phase = getStoryPhase(currentTurn, maxTurns)
  const contextBlock = buildContextBlock(context)

  const rolesBlock = roles
    .map((r) => `- [roleIndex ${r.id}] ${r.name}: ${r.description}. Special ability (one-time): ${r.ability}${r.used ? ' [USED]' : ''}`)
    .join('\n')

  const parametersBlock = parameters
    .map((p) => `- ${p.name}: ${p.states.join(' → ')}`)
    .join('\n')

  const exampleBlock = language === 'et' ? `\n${ESTONIAN_EXAMPLE}\n` : ''

  const system = `${langInstruction(language)}

You are the narrator for an interactive group storytelling adventure played aloud by a group of friends. Players collectively make choices; you narrate the consequences. Your goal: create a genuinely thrilling story where every choice matters.

STORY: "${title}"
GENRE: ${genre}
PREMISE: ${summary}${contextBlock}

CHARACTERS:
${rolesBlock}

PARAMETERS (each has 4 states, best → worst):
${parametersBlock}${exampleBlock}
CORE RULES:

1. SCENE LENGTH IS LAW. Write 2-3 sentences per scene in setup/inciting/rising, 3-4 at climax, 4-5 at resolution. Count them. HARD MAX: 60 words per scene in non-climax turns. Groups read aloud — dense prose loses the room.

2. PARAMETERS AS SENSORY DETAIL. Each scene must surface ≥1 parameter state as something a character sees/hears/feels. Do NOT write them as narrator metadata ("Pinge tõuseb"). Show them ("Kütusenäidik jõuab punasesse; Mari käsi väriseb rooli peal").

3. AFTERMATH OPENING (from turn 2 onwards). The previous choice named an acting character (and sometimes a target). THIS scene MUST open with that person visible in the FIRST beat — through a single present-tense sensory detail: trembling hand, held breath, blood on a sleeve, silent stare, a half-finished word. Never retrospective summary ("Mari sai haavata eelmises stseenis"). Never neutral narrator exposition before the aftermath line. One line of living residue, then the new situation beat. The consequence compounds over turns: a limp from turn 3 still shows in turn 7. Turn 1 has no prior choice — skip this rule only for the opening scene.

4. DIRECT DIALOGUE — use it. At least one scene out of every 2-3 turns must contain a direct spoken fragment from a character. Half a sentence muttered in the action is better than a speech — "'Ma ei saa enam ülesse,' sosistab Liis" is alive; "Liis tunneb end halvasti" is dead. When two characters visibly disagree within a scene, at least one of them SAYS something out loud. Dialogue turns narration into performance — the reader can dramatize a voice, not a statement.

5. CHOICES BELONG TO CHARACTERS, NOT THE GROUP. Every choice is ONE named person's move. Set actor = their roleIndex (0-based). The choice text MUST name that person as the grammatical subject — third person, never "meie"/"we". Goal: before the group decides, they ARGUE: "aga Mari kardab pimedat, saadame hoopis Jaanu". A choice that says "Grupp avab ukse" is a design failure — rewrite as "Mari avab ukse". The actor may differ between the 3 choices (different people stepping forward) or repeat (same person, different approaches) — but one of the 3 choices offering the SAME person in multiple variants is usually lazy; prefer distributing agency across the group when plausible. If the action concretely costs a DIFFERENT person (the actor leaves them behind / puts them in danger / exposes their secret), set target = that person's roleIndex. Otherwise omit target.

6. CHOICES DECLARE THEIR COST. Each choice is a TRADE — write the cost into the choice text itself AND fill expectedChanges to match. The text and expectedChanges MUST agree in sign: if the text implies spending X, then X's expectedChange must be negative. NEVER output a choice whose expectedChanges are all zero or all positive — there must be at least one negative cost. The UI no longer shows numeric costs to players — the TEXT must carry the implication ("Mari avab ukse valjult" → pressure clearly rises; "Jaan sõidab tagasi bensiinijaama" → fuel clearly drops). Do not spell the numeric cost in prose ("kulutame 2 kütust") — let the action speak.

7. TRILEMMA — three orthogonal moral axes, not three flavours of one question. The 3 choices must each test a DIFFERENT kind of decision. Think of the axes as: (a) courage vs. caution (who takes the risk), (b) loyalty vs. pragmatism (is someone sacrificed so others survive), (c) truth vs. concealment (is a secret revealed or hidden). At least two of the three axes must appear across the three choices. Two choices that test the same axis (even via different actions) are a design failure — rewrite one to test a different axis. They must also touch a DIFFERENT combination of parameters.

8. NO HIDDEN RULES. All parameter changes you apply must come from the chosen action's consequences that are visible to the player in the scene and choices. Do NOT auto-degrade any parameter "because time passed". If pressure should rise, write it into the scene's narrated events or the choice costs — never as silent drift.

9. parameter.change semantics: +1 = better (index toward best), -1 = worse (index toward worst). Use ±2 ONLY at climax or when a choice is explicitly extreme ("riskime kõigega"). Never ±2 in setup or inciting.

10. JUST-BROKE DRAMATIZATION: If CURRENT PARAMETER STATES marks a parameter "⚠ JUST HIT WORST", open the scene with the immediate narrative consequence of that collapse — the group lives through the disaster (supplies run out, trust collapses, pressure overwhelms). This takes precedence over rule 3 when both apply — the break IS the aftermath. Do NOT set gameOver from this alone — dramatize it. New choices should reflect the changed situation.

11. ABILITIES: offer only in rising or climax, when dramatically earned. isAbility: true + actor = the ability owner's roleIndex. Never in setup, inciting, resolution.

12. FINAL TURN at maxTurns: set gameOver: true. gameOverText names the parameters that held and those that broke, the choices that mattered, what each character became.

SELF-CHECK before responding:
- Scene length: count sentences. Under limit? If not, DELETE until it is.
- If this is turn 2+, does the scene OPEN with the previous choice's actor/target through a present-tense sensory detail? If not, rewrite the first line.
- Has a direct spoken line appeared in the last 2-3 turns? If not, slip one short fragment into THIS scene.
- Every choice has an actor set, and its text names that actor as the grammatical subject? If any choice says "meie"/"we"/"grupp" — rewrite.
- Do the 3 choices test at least 2 different moral axes (courage/loyalty/truth), or are they three flavours of the same question?
- Each choice has ≥1 negative expectedChange? If any choice is "free", rewrite it.
- Choices cover 3 different parameter combinations?
- Every choice text matches its expectedChanges in sign?
- Scene surfaces ≥1 parameter as sensory detail (not metadata)?`

  const currentStates = parameters
    .map((p) => {
      const stateName = p.states[p.currentStateIndex]
      const step = `${p.currentStateIndex + 1}/${p.states.length}`
      let marker = ''
      if (p.justBroke) marker = ' ⚠ JUST HIT WORST — open next scene with the consequence of this collapse'
      else if (p.currentStateIndex >= p.states.length - 1) marker = ' (still at worst state)'
      else if (p.currentStateIndex === p.states.length - 2) marker = ' (near worst — one step from collapse)'
      return `- ${p.name}: "${stateName}" (step ${step})${marker}`
    })
    .join('\n')

  const availableAbilities = roles.filter((r) => !r.used)
  const abilitiesLine = availableAbilities.length > 0
    ? `AVAILABLE ABILITIES:\n${availableAbilities.map((r) => `- ${r.name} (actor: ${r.id}): ${r.ability}`).join('\n')}`
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

  const forceEndBlock = forceEnd === 'unrecoverable'
    ? `\n⚠ FORCED CONCLUSION — UNRECOVERABLE STATE ⚠
Two or more parameters have collapsed to worst state simultaneously. The situation is unrecoverable.

Write the final scene NOW:
- Set gameOver: true.
- Write a full gameOverText (3-5 paragraphs) that names which parameters held and which broke, the key choices that led here, and what happened to each character. Honor the journey — this is the group's ending.
- The scene field can be short — the gameOverText carries the weight.
- You may output choices but they will not be used; prefer empty array or minimal placeholders.
`
    : ''

  const phaseLine = forceEnd === 'unrecoverable' ? '' : `${phaseInstruction(phase)}\n`

  const user = `TURN ${currentTurn} / ${maxTurns}

${langReminder}${phaseLine}${forceEndBlock}${recentScenesBlock}CURRENT PARAMETER STATES:
${currentStates}

${abilitiesLine}

${choiceLine}${freeTextNote}`

  return { system, user }
}
