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
  | 'game'
  | 'gameOver'

export interface Role {
  id: number
  name: string
  description: string
  ability: string
  used: boolean
}

export interface Parameter {
  name: string
  states: string[]
  currentStateIndex: number
  // true for exactly one turn — the turn it transitions into its worst state.
  // Used by prompts to signal the AI that next scene must dramatize the consequence.
  justBroke?: boolean
}

export interface ParameterCost {
  name: string
  change: number
}

export interface Choice {
  text: string
  isAbility: boolean
  // Who performs this action. Role index (0-based). For ability choices this
  // is also the ability owner. Optional for backward compat, but prompts now
  // require it — UI falls back silently if a model omits it.
  actor?: number
  // Who concretely pays / is affected (if the action targets a specific person
  // other than the actor). Example: "Mari jätab Jaane maja ette" → actor=Mari,
  // target=Jaan. Omitted when the cost is shared or unnamed.
  target?: number
  expectedChanges?: ParameterCost[]
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
