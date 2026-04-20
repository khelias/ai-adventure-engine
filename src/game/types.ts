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
}

export interface ParameterCost {
  name: string
  change: number
}

export interface Choice {
  text: string
  isAbility: boolean
  roleIndex?: number
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
