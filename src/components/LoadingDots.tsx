import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { translations } from '../i18n/translations'

export function LoadingDots() {
  return (
    <span className="loading-dots">
      <span />
      <span />
      <span />
    </span>
  )
}

// Between-turns waiter: shows dots + one rotating Estonian/English hint so
// 20-30 seconds of waiting feels like "the story is being written" rather
// than "the app is frozen". Cycles hints every 4s. Used only in the
// turn-loading slot in GameScreen — button loadings stay on bare dots.
export function LoadingWithHint() {
  const language = useGameStore((s) => s.settings.language)
  const hints = translations[language].loadingHints
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * hints.length))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIdx((i) => (i + 1) % hints.length)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [hints.length])

  return (
    <div className="loading-hint-wrap">
      <LoadingDots />
      <p key={idx} className="loading-hint">
        {hints[idx]}
      </p>
    </div>
  )
}
