import { create } from 'zustand'
import type {
  Choice,
  GameOverKind,
  Parameter,
  Role,
  Screen,
  Settings,
  Story,
  Vibe,
} from '../game/types'
import { durationToMaxTurns } from '../game/engine'

const PROVIDER_STORAGE_KEY = 'adventureProvider'

function loadStoredProvider(): Settings['provider'] {
  if (typeof window === 'undefined') return 'gemini'
  const stored = window.localStorage.getItem(PROVIDER_STORAGE_KEY)
  return stored === 'claude' || stored === 'gemini' ? stored : 'claude'
}

const initialSettings: Settings = {
  language: 'et',
  provider: loadStoredProvider(),
  players: 4,
  genre: 'Zombies',
  duration: 'Medium',
  context: {
    location: '',
    playersDesc: '',
    vibe: '' as Vibe,
    insideJoke: '',
  },
}

interface GameState {
  settings: Settings
  screen: Screen

  // Story draft (set after AI generation, before role assignment)
  availableStories: Story[]

  // Active game
  title: string
  summary: string
  roles: Role[]
  parameters: Parameter[]
  currentTurn: number
  maxTurns: number
  sceneText: string
  choices: Choice[]
  recentScenes: string[]

  // End state
  gameOverKind: GameOverKind
  gameOverTitle: string
  gameOverText: string

  // UI
  isLoading: boolean
  error: string | null
}

interface GameActions {
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void
  setScreen(screen: Screen): void
  setAvailableStories(stories: Story[]): void
  initStory(story: Story): void
  setRoleName(index: number, name: string): void
  startGame(): void
  setTurnResult(payload: {
    sceneText: string
    choices: Choice[]
    parameters: Parameter[]
    roles: Role[]
    currentTurn: number
  }): void
  setGameOver(kind: GameOverKind, title: string, text: string): void
  setLoading(loading: boolean): void
  setError(error: string | null): void
  reset(): void
}

const initialGameSlice = {
  screen: 'setup' as Screen,
  availableStories: [] as Story[],
  title: '',
  summary: '',
  roles: [] as Role[],
  parameters: [] as Parameter[],
  currentTurn: 0,
  maxTurns: 0,
  sceneText: '',
  choices: [] as Choice[],
  recentScenes: [] as string[],
  gameOverKind: null as GameOverKind,
  gameOverTitle: '',
  gameOverText: '',
  isLoading: false,
  error: null as string | null,
}

export const useGameStore = create<GameState & GameActions>()((set) => ({
  settings: initialSettings,
  ...initialGameSlice,

  setSetting: (key, value) =>
    set((state) => {
      if (key === 'provider' && typeof window !== 'undefined') {
        window.localStorage.setItem(PROVIDER_STORAGE_KEY, value as string)
      }
      return { settings: { ...state.settings, [key]: value } }
    }),

  setScreen: (screen) => set({ screen }),

  setAvailableStories: (availableStories) =>
    set({ availableStories, screen: 'storyChoice' }),

  initStory: (story) =>
    set({
      title: story.title,
      summary: story.summary,
      roles: story.roles.map((r, index) => ({
        id: index,
        name: r.name,
        description: r.description,
        ability: r.ability,
        used: false,
      })),
      parameters: story.parameters.map((p) => ({
        ...p,
        currentStateIndex: 1,
      })),
      screen: 'roleAssignment',
    }),

  setRoleName: (index, name) =>
    set((state) => ({
      roles: state.roles.map((r, i) => (i === index ? { ...r, name } : r)),
    })),

  startGame: () =>
    set((state) => ({
      currentTurn: 1,
      maxTurns: durationToMaxTurns(state.settings.duration),
      screen: 'game',
    })),

  setTurnResult: ({ sceneText, choices, parameters, roles, currentTurn }) =>
    set((state) => ({
      sceneText,
      choices,
      parameters,
      roles,
      currentTurn,
      recentScenes: [...state.recentScenes, sceneText].slice(-2),
    })),

  setGameOver: (kind, title, text) =>
    set({
      screen: 'gameOver',
      gameOverKind: kind,
      gameOverTitle: title,
      gameOverText: text,
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  reset: () =>
    set((state) => ({
      ...initialGameSlice,
      settings: state.settings,
    })),
}))
