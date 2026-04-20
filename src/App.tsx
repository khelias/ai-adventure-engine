import { useGameStore } from './store/gameStore'
import { LangToggle } from './components/LangToggle'
import { SetupScreen } from './components/SetupScreen'
import { StoryChoiceScreen } from './components/StoryChoiceScreen'
import { RoleAssignmentScreen } from './components/RoleAssignmentScreen'
import { GameScreen } from './components/GameScreen'
import { GameOverScreen } from './components/GameOverScreen'

export default function App() {
  const screen = useGameStore((s) => s.screen)
  const onPage = screen === 'game' || screen === 'storyChoice' || screen === 'roleAssignment' || screen === 'gameOver'

  return (
    <div className="min-h-dvh flex flex-col">

      {/* Frame header */}
      <header
        className="flex justify-between items-center px-4 sm:px-6 py-3"
        style={{ borderBottom: '1px solid var(--frame-edge)' }}
      >
        <a
          href="/"
          className="type-caps-frame hover:opacity-80 transition-opacity"
          style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a3a28' }}
        >
          ← Games
        </a>
        <LangToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex justify-center px-4 sm:px-5 py-6 sm:py-10">
        {onPage ? (
          <div className="page w-full max-w-xl">
            <div className="relative px-6 sm:px-8 py-8">
              {screen === 'storyChoice' && <StoryChoiceScreen />}
              {screen === 'roleAssignment' && <RoleAssignmentScreen />}
              {screen === 'game' && <GameScreen />}
              {screen === 'gameOver' && <GameOverScreen />}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <SetupScreen />
          </div>
        )}
      </main>
    </div>
  )
}
