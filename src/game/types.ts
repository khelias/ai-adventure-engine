export type Language = 'et' | 'en'
export type Provider = 'claude' | 'gemini'
export type Duration = 'Short' | 'Medium' | 'Long'
export type Genre =
  | 'Zombies'
  | 'Fantasy'
  | 'Sci-Fi'
  | 'Thriller'
  | 'Cyberpunk'
  | 'Post-Apocalyptic'

export type Screen =
  | 'setup'
  | 'storyChoice'
  | 'roleAssignment'
  | 'secretAssignment'
  | 'game'
  | 'gameOver'

export type SecretArchetype =
  | 'optimist'    // all three params end top half
  | 'traitor'     // parametric end (2+ params at worst)
  | 'survivor'    // narrative end, regardless of state
  | 'keeper'      // a specific param stays top half
  | 'sacrificer'  // a specific param ends at worst
  | 'guardian'    // zero params at worst

export interface Secret {
  ownerRoleId: number
  archetype: SecretArchetype
  // Populated only for keeper/sacrificer — the parameter name they're tied to.
  paramName?: string
  // 'won' / 'lost' set by evaluateSecrets at endgame. undefined during play.
  result?: 'won' | 'lost'
}

export interface Role {
  id: number
  name: string
  description: string
  ability: string
  used: boolean
}

export type ParameterArchetype =
  | 'resource'
  | 'bond'
  | 'pressure'
  | 'secret'
  | 'curse'
  | 'time'
  | 'guilt'
  | 'proof'
  | 'promise'
  | 'hunger'
  | 'debt'

export interface Parameter {
  name: string
  states: string[]
  currentStateIndex: number
  // Mechanical shape — drives UI tone and lets secrets/ownership logic
  // reason about what kind of pressure this is. AI self-declares.
  archetype?: ParameterArchetype
  // Which role (0-based id) this parameter is anchored to. Present when the
  // parameter's name references a specific character. Secrets for that role's
  // player can prefer-match against their owned parameter.
  ownerRoleId?: number
  // true for exactly one turn — the turn it transitions into its worst state.
  // Used by prompts to signal the AI that next scene must dramatize the consequence.
  justBroke?: boolean
  // true for exactly one turn — any turn the state index actually moved.
  // Drives the UI's 2-second "this one just shifted" highlight.
  justMoved?: boolean
}

export interface ParameterCost {
  name: string
  change: number
}

export interface Choice {
  text: string
  isAbility: boolean
  // Who performs this action. Role index (0-based). For ability choices this
  // is also the ability owner. Schema-required — Claude must emit it.
  actor: number
  // Who concretely pays / is affected (if the action targets a specific person
  // other than the actor). Example: "Mari jätab Jaane maja ette" → actor=Mari,
  // target=Jaan. Omitted when the cost is shared or falls on the actor.
  target?: number
  expectedChanges: ParameterCost[]
}

export interface Story {
  title: string
  summary: string
  roles: Omit<Role, 'id' | 'used'>[]
  parameters: Omit<Parameter, 'currentStateIndex'>[]
}

export type Vibe = '' | 'light' | 'tense' | 'dark'

export interface ContextInput {
  location: string
  playersDesc: string
  vibe: Vibe
  insideJoke: string
}

export interface Settings {
  language: Language
  provider: Provider
  players: number
  genre: Genre
  duration: Duration
  context: ContextInput
}

export type GameOverKind = 'narrative' | 'parametric' | null
