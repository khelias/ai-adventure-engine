import { useGameStore } from './store/gameStore'
import { LangToggle } from './components/LangToggle'
import { SetupScreen } from './components/SetupScreen'
import { StoryChoiceScreen } from './components/StoryChoiceScreen'
import { RoleAssignmentScreen } from './components/RoleAssignmentScreen'
import { GameScreen } from './components/GameScreen'
import { GameOverScreen } from './components/GameOverScreen'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-neutral-900">
        <span className="text-sm text-neutral-500 tracking-wide uppercase">
          V2 · Faas 0
        </span>
        <LangToggle />
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8">
        {screen === 'setup' && <SetupScreen />}
        {screen === 'storyChoice' && <StoryChoiceScreen />}
        {screen === 'roleAssignment' && <RoleAssignmentScreen />}
        {screen === 'game' && <GameScreen />}
        {screen === 'gameOver' && <GameOverScreen />}
      </main>
    </div>
  )
}
