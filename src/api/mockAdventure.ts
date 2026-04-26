import type { Language, ParameterArchetype } from '../game/types'

type JsonSchema = Record<string, unknown>

interface MockCallArgs {
  prompt: string
  schema: JsonSchema
  systemPrompt?: string
  language?: Language
}

interface MockParameter {
  name: string
  states: string[]
  archetype: ParameterArchetype
}

interface MockRole {
  name: string
  description: string
  ability: string
  abilityParameter: string
}

interface MockStory {
  title: string
  summary: string
  roles: MockRole[]
  parameters: MockParameter[]
}

const ET_PARAMETERS: MockParameter[] = [
  {
    name: 'Päästeaken',
    states: ['Selgelt avatud', 'Kitseneb', 'Sekundid jäänud', 'Kadunud'],
    archetype: 'time',
  },
  {
    name: 'Grupi usaldus',
    states: ['Ühtne laud', 'Vaikne kahtlus', 'Lahtised süüdistused', 'Täielik murd'],
    archetype: 'bond',
  },
  {
    name: 'Varude seis',
    states: ['Kotid täis', 'Pool alles', 'Viimased riismed', 'Täiesti tühi'],
    archetype: 'resource',
  },
]

const EN_PARAMETERS: MockParameter[] = [
  {
    name: 'Rescue Window',
    states: ['Clearly open', 'Narrowing', 'Seconds left', 'Gone'],
    archetype: 'time',
  },
  {
    name: 'Group Trust',
    states: ['One table', 'Quiet doubt', 'Open accusations', 'Total break'],
    archetype: 'bond',
  },
  {
    name: 'Supply Cache',
    states: ['Bags full', 'Half left', 'Last scraps', 'Completely empty'],
    archetype: 'resource',
  },
]

const ET_ROLES: MockRole[] = [
  {
    name: 'Mari',
    description: 'Endine bussijaama vahetusejuht, kes tunneb terminali lukke ja töötajate vaheuksi.',
    ability: 'Leiutab kapist leitud hoolduskaardiga lühikese tee dispetseriruumi.',
    abilityParameter: 'Päästeaken',
  },
  {
    name: 'Jaan',
    description: 'Rahulik elektrik, kes oskab vaikiva generaatori hääle järgi ära tunda, mis veel töötab.',
    ability: 'Ühendab terminali vana reklaampaneeli akude külge ja võidab valgusega paar minutit.',
    abilityParameter: 'Päästeaken',
  },
  {
    name: 'Liis',
    description: 'Kogukonna vabatahtlik, kes mäletab, kellele enne sulgemist lubadusi anti.',
    ability: 'Loeb ette peidetud nimekirja ja sunnib grupi korraks ausalt rääkima.',
    abilityParameter: 'Grupi usaldus',
  },
  {
    name: 'Rasmus',
    description: 'Kuller, kelle rattakottides on liiga palju väikseid tööriistu ja üks halb saladus.',
    ability: 'Avab rattalukuga kaubakapi, mille kohta ta varem valetas.',
    abilityParameter: 'Varude seis',
  },
  {
    name: 'Kärt',
    description: 'Meditsiinitudeng, kes oskab paanikas inimesi tegutsema panna ilma häält tõstmata.',
    ability: 'Jagab apteegiletist leitud süstlad ja sidemed nii, et keegi ei tunne end mahajäetuna.',
    abilityParameter: 'Grupi usaldus',
  },
  {
    name: 'Toomas',
    description: 'Öine turvamees, kes teab, milline valvekaamera päriselt salvestab ja milline ainult vilgub.',
    ability: 'Käivitab turvaruumi monitoriseina ja leiab varude kasti peidetud teeninduslifti alt.',
    abilityParameter: 'Varude seis',
  },
]

const EN_ROLES: MockRole[] = [
  {
    name: 'Mara',
    description: 'A former terminal shift lead who knows the staff doors and forgotten locks.',
    ability: 'Uses the maintenance badge from the locker to open the dispatch corridor.',
    abilityParameter: 'Rescue Window',
  },
  {
    name: 'Jonas',
    description: 'A quiet electrician who can hear which parts of the old generator still work.',
    ability: 'Wires the dead advert board to the emergency batteries and buys the group a few minutes.',
    abilityParameter: 'Rescue Window',
  },
  {
    name: 'Leah',
    description: 'A community volunteer who remembers every promise made before the doors closed.',
    ability: 'Reads the hidden evacuation list aloud and forces the group into one honest conversation.',
    abilityParameter: 'Group Trust',
  },
  {
    name: 'Rasmus',
    description: 'A courier with too many small tools in his bike bag and one useful lie.',
    ability: 'Picks the cargo locker he pretended not to know about.',
    abilityParameter: 'Supply Cache',
  },
  {
    name: 'Kara',
    description: 'A medical student who can turn panic into motion without raising her voice.',
    ability: 'Divides the pharmacy counter supplies so nobody feels abandoned.',
    abilityParameter: 'Group Trust',
  },
  {
    name: 'Tomas',
    description: 'A night guard who knows which cameras record and which only blink.',
    ability: 'Starts the security monitors and spots a supply crate under the service lift.',
    abilityParameter: 'Supply Cache',
  },
]

function schemaKind(schema: JsonSchema): string {
  const properties = schema.properties
  if (!properties || typeof properties !== 'object') return ''
  return Object.keys(properties).sort().join(',')
}

function inferLanguage(args: MockCallArgs): Language {
  if (args.language) return args.language
  const text = `${args.systemPrompt ?? ''}\n${args.prompt}`
  if (text.includes('Output language must be English') || text.includes('LANGUAGE: Write all player-facing text in English')) {
    return 'en'
  }
  return 'et'
}

function requestedPlayers(prompt: string): number {
  const match =
    prompt.match(/exactly\s+(\d+)\s+unique roles/i) ??
    prompt.match(/generate\s+(\d+)\s+thematically appropriate roles/i) ??
    prompt.match(/for\s+(\d+)\s+players/i)
  const parsed = match ? Number(match[1]) : 6
  return Math.max(3, Math.min(6, Number.isFinite(parsed) ? parsed : 6))
}

function baseStory(language: Language, players: number): MockStory {
  const isEt = language === 'et'
  const parameters = isEt ? ET_PARAMETERS : EN_PARAMETERS
  const roles = (isEt ? ET_ROLES : EN_ROLES).slice(0, players)

  return {
    title: isEt ? 'Ööbuss terminalist 13' : 'Night Bus From Terminal 13',
    summary: isEt
      ? 'Viimane ööbuss seisab lukustatud terminali all, mootor käib ja tablool vilgub marsruut, mida linnakaardil ei ole. Grupp peab hoidma päästeakna avatuna, usaldama üksteist piisavalt ning mitte kulutama varusid enne, kui buss leiab õige väljapääsu.'
      : 'The last night bus waits under the locked terminal, engine running, while its sign blinks a route missing from every city map. The group must keep the rescue window open, trust each other long enough, and spend supplies carefully before the bus finds the right exit.',
    roles,
    parameters,
  }
}

function mockStoryResponse(prompt: string, language: Language) {
  return { stories: [baseStory(language, requestedPlayers(prompt))] }
}

function mockCustomStoryResponse(prompt: string, language: Language) {
  const story = baseStory(language, requestedPlayers(prompt))
  return {
    roles: story.roles,
    parameters: story.parameters,
  }
}

function mockSequelResponse(language: Language) {
  const params = language === 'et'
    ? [
        {
          name: 'Tunnistajate vaikus',
          states: ['Kõik räägivad', 'Poolikud lood', 'Kinni pigistatud suud', 'Täielik vaikus'],
          archetype: 'proof' as const,
        },
        {
          name: 'Bussi süda',
          states: ['Ühtlane rütm', 'Vahelejätud', 'Metall karjub', 'Mootor surnud'],
          archetype: 'resource' as const,
        },
        {
          name: 'Vana võlg',
          states: ['Andestatud', 'Meelde tuletatud', 'Nõutakse tasu', 'Tasumata veri'],
          archetype: 'debt' as const,
        },
      ]
    : [
        {
          name: 'Witness Silence',
          states: ['Everyone talks', 'Half stories', 'Sealed mouths', 'Total silence'],
          archetype: 'proof' as const,
        },
        {
          name: 'Bus Heart',
          states: ['Steady rhythm', 'Missing beats', 'Metal screaming', 'Engine dead'],
          archetype: 'resource' as const,
        },
        {
          name: 'Old Debt',
          states: ['Forgiven', 'Remembered', 'Payment demanded', 'Blood unpaid'],
          archetype: 'debt' as const,
        },
      ]

  return language === 'et'
    ? {
        newAbilities: [
          'Leiab bussi armatuurlaua alt maksekviitungi, mis tõestab, kes sõidu tellis.',
          'Kuuleb mootori rütmist, millal järgmine seiskumine päriselt tuleb.',
          'Tunnistab ühe vana vale üles enne, kui võlg seda relvana kasutab.',
          'Avab pakiruumi topeltpõhja ja toob sealt välja varutud generaatoririhma.',
          'Rahustab tunnistaja maha vana koolimaja nimega, mida ainult kohalik teab.',
          'Näitab valvekaamera pimedat nurka, kust saab korraks ilma jäljeta liikuda.',
        ],
        newAbilityParameters: [
          'Tunnistajate vaikus',
          'Bussi süda',
          'Vana võlg',
          'Bussi süda',
          'Tunnistajate vaikus',
          'Vana võlg',
        ],
        newParameters: params,
      }
    : {
        newAbilities: [
          'Finds the payment receipt under the dashboard and proves who ordered the route.',
          'Hears from the engine rhythm when the next stall will really hit.',
          'Confesses one old lie before the debt can become a weapon.',
          'Opens the luggage bay false floor and pulls out a spare generator belt.',
          'Calms a witness with the old schoolhouse name only locals know.',
          'Shows the blind spot in the security camera path for one clean move.',
        ],
        newAbilityParameters: [
          'Witness Silence',
          'Bus Heart',
          'Old Debt',
          'Bus Heart',
          'Witness Silence',
          'Old Debt',
        ],
        newParameters: params,
      }
}

function parseTurn(prompt: string) {
  const turnMatch = prompt.match(/# TURN\s+(\d+)\s*\/\s*(\d+)/)
  const currentTurn = turnMatch ? Number(turnMatch[1]) : 1
  const maxTurns = turnMatch ? Number(turnMatch[2]) : 20
  return { currentTurn, maxTurns }
}

function parseParameterNames(prompt: string, language: Language): string[] {
  const matches = [...prompt.matchAll(/- \*\*([^*]+)\*\*: "[^"]+"/g)]
    .flatMap((match) => match[1] ? [match[1]] : [])
  if (matches.length >= 3) return matches.slice(0, 3)
  return (language === 'et' ? ET_PARAMETERS : EN_PARAMETERS).map((p) => p.name)
}

function parseChoiceText(prompt: string, language: Language): string {
  const match = prompt.match(/The players chose: \*\*"([^"]+)"\*\*/)
  if (match?.[1]) return match[1]
  return language === 'et' ? 'Mäng algab.' : 'The game begins.'
}

function makeChoices(language: Language, params: string[], currentTurn: number) {
  const fallbackParams = (language === 'et' ? ET_PARAMETERS : EN_PARAMETERS).map((p) => p.name)
  const p0 = params[0] ?? fallbackParams[0] ?? 'First parameter'
  const p1 = params[1] ?? fallbackParams[1] ?? p0
  const p2 = params[2] ?? fallbackParams[2] ?? p1
  const cycle = currentTurn % 3

  if (language === 'et') {
    return [
      {
        text: cycle === 0
          ? 'Hoiame värava lahti ja jätame peibutuseks osa varudest maha.'
          : 'Kiirustame bussi poole enne, kui kõik jõuavad kahtlused välja öelda.',
        isAbility: false,
        expectedChanges: [{ name: p0, change: +1 }, { name: p2, change: -1 }],
      },
      {
        text: 'Räägime peidetud plaanist ausalt ja kaotame sellega väärtuslikku aega.',
        isAbility: false,
        expectedChanges: [{ name: p1, change: +1 }, { name: p0, change: -1 }],
      },
      {
        text: 'Jagame viimased tarbed ümber, kuigi see toob vana süüdistuse tagasi.',
        isAbility: false,
        expectedChanges: [{ name: p2, change: +1 }, { name: p1, change: -1 }],
      },
    ]
  }

  return [
    {
      text: cycle === 0
        ? 'Keep the gate open and leave part of the supplies as a decoy.'
        : 'Rush toward the bus before every doubt is spoken aloud.',
      isAbility: false,
      expectedChanges: [{ name: p0, change: +1 }, { name: p2, change: -1 }],
    },
    {
      text: 'Tell the hidden plan honestly and lose precious time because of it.',
      isAbility: false,
      expectedChanges: [{ name: p1, change: +1 }, { name: p0, change: -1 }],
    },
    {
      text: 'Redistribute the last useful supplies even though an old accusation returns.',
      isAbility: false,
      expectedChanges: [{ name: p2, change: +1 }, { name: p1, change: -1 }],
    },
  ]
}

function mockTurnResponse(prompt: string, language: Language) {
  const { currentTurn, maxTurns } = parseTurn(prompt)
  const params = parseParameterNames(prompt, language)
  const selected = parseChoiceText(prompt, language)
  const isForcedEnd = prompt.includes('FORCED CONCLUSION')
  const isAbility = prompt.includes('spent') || prompt.includes('one-time special ability')
  const isFirstTurn = currentTurn === 1
  const isGameOver = isForcedEnd || currentTurn >= maxTurns
  const movedParam = params[currentTurn % params.length]
  const helpedParam = params[(currentTurn + 1) % params.length]

  if (isGameOver) {
    return language === 'et'
      ? {
          scene: `Terminali tablool jääb korraks põlema ainult üks rida: TEST-MOCK ${currentTurn}/${maxTurns}. Uksed avanevad ja ööbuss ootab, nagu oleks ta kogu aja teie otsuseid kuulanud.`,
          parameters: [],
          choices: [],
          consequences: [],
          gameOver: true,
          gameOverText: `Buss liigub terminalist välja ilma päris mudelipäringuta. ${params[0]}, ${params[1]} ja ${params[2]} jäävad nähtavalt lõpuseisu, nii et game-over ekraan saab näidata pikka kokkuvõtet, saladuste tulemusi ja lõplikke parameetreid.\n\nSee mock-lõpp on meelega pikk. Mari ja teised saavad eraldi hetke, terminali oht saab sulgemise ning mängu täispikk voog jõuab lõpuni ilma Gemini või Claude krediiti kasutamata.\n\nKui seda kasutatakse UI testimiseks, on oluline ainult lepingu kuju: scene, choices, parameters, consequences ja gameOverText käituvad nagu päris vastus.`,
        }
      : {
          scene: `The terminal board holds on one line: TEST-MOCK ${currentTurn}/${maxTurns}. The doors open, and the night bus waits as if it has heard every decision.`,
          parameters: [],
          choices: [],
          consequences: [],
          gameOver: true,
          gameOverText: `The bus leaves the terminal without a real model request. ${params[0]}, ${params[1]}, and ${params[2]} remain visible in their final states, so the game-over screen can render the long ending, secret results, and final parameters.\n\nThis mock ending is intentionally long enough for UI testing. Each role gets a closing beat, the threat resolves, and the full game loop reaches completion without spending Gemini or Claude credit.\n\nFor test purposes, the important part is the contract shape: scene, choices, parameters, consequences, and gameOverText behave like a real response.`,
        }
  }

  const parameters = isFirstTurn
    ? [{ name: params[0], change: -1 }]
    : isAbility
      ? [{ name: helpedParam, change: +1 }]
      : []

  const consequences = language === 'et'
    ? [
        {
          parameterName: parameters[0]?.name ?? movedParam,
          text: isAbility
            ? `${helpedParam} saab mock-eri oskusest nähtava hingamisruumi.`
            : `${movedParam} liigub mock-stseenis selgelt uude seisu.`,
        },
      ]
    : [
        {
          parameterName: parameters[0]?.name ?? movedParam,
          text: isAbility
            ? `${helpedParam} visibly catches a break from the mock ability.`
            : `${movedParam} clearly shifts in the mock scene.`,
        },
      ]

  return language === 'et'
    ? {
        scene: isFirstTurn
          ? 'Mock-öö algab terminali klaaskatuse all. Ööbuss number 13 turtsatab käima, varjud pressivad vastu lukustatud uksi ja tablool vilgub marsruut, mida keegi ei mäleta ostnud olevat.\n\nSee on teststseen: piisavalt pikk, et kontrollida proosat, parameetreid, valikuid ja hilisemat saladuste voogu ilma AI teenust kutsumata.'
          : `Valitud tegevus oli: "${selected}". Selle järel liigub grupp läbi terminali teenindustsooni; üks lubadus peab, teine hakkab murenema ja mock-jutustaja hoiab tempo teadlikult stabiilsena.\n\nStseen ${currentTurn}/${maxTurns} annab UI-le uut teksti, tagajärje ja kolm valikut, kuid ei saada ühtegi päringut välisesse mudelisse.`,
        parameters,
        choices: makeChoices(language, params, currentTurn),
        consequences,
        gameOver: false,
      }
    : {
        scene: isFirstTurn
          ? 'The mock night begins beneath the terminal glass roof. Bus 13 coughs awake, shadows press against the locked doors, and the route board blinks a destination nobody remembers buying.\n\nThis is a test scene: long enough to exercise prose, parameters, choices, and the later secret flow without calling an AI service.'
          : `The chosen action was: "${selected}". After it, the group moves through the service level; one promise holds, another begins to crack, and the mock narrator keeps the pace intentionally steady.\n\nScene ${currentTurn}/${maxTurns} gives the UI fresh text, consequences, and three choices, but sends no request to an external model.`,
        parameters,
        choices: makeChoices(language, params, currentTurn),
        consequences,
        gameOver: false,
      }
}

export function callMockAI<T>({
  prompt,
  schema,
  systemPrompt,
  language,
}: MockCallArgs): T {
  const resolvedLanguage = inferLanguage({ prompt, schema, systemPrompt, language })
  const kind = schemaKind(schema)

  if (kind === 'stories') {
    return mockStoryResponse(prompt, resolvedLanguage) as T
  }
  if (kind === 'parameters,roles') {
    return mockCustomStoryResponse(prompt, resolvedLanguage) as T
  }
  if (kind === 'newAbilities,newAbilityParameters,newParameters') {
    return mockSequelResponse(resolvedLanguage) as T
  }
  if (kind === 'choices,consequences,gameOver,gameOverText,parameters,scene') {
    return mockTurnResponse(prompt, resolvedLanguage) as T
  }

  throw new Error(`Mock provider does not recognize schema shape: ${kind || 'unknown'}`)
}
