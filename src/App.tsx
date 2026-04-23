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
      <header
        className="flex justify-between items-center px-4 sm:px-6 py-3"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <a
          href="/"
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ← Games
        </a>
        {screen === 'setup' && <LangToggle />}
      </header>

      <main className="flex-1 flex justify-center px-4 sm:px-5 py-6 sm:py-8">
        {screen === 'setup' ? (
          <SetupScreen />
        ) : (
          <div className="w-full max-w-xl">
            {screen === 'storyChoice' && <StoryChoiceScreen />}
            {screen === 'roleAssignment' && <RoleAssignmentScreen />}
            {screen === 'game' && <GameScreen />}
            {screen === 'gameOver' && <GameOverScreen />}
          </div>
        )}
      </main>
    </div>
  )
}
