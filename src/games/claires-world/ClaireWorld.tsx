import { useState, useCallback } from 'react'
import ClaireStrip from './components/ClaireStrip'
import ClaireBoard from './components/ClaireBoard'
import ModeIndicator from './components/ModeIndicator'
import MoodBar from './components/MoodBar'
import { useGameState } from './hooks/useGameState'
import { useAudio } from './hooks/useAudio'
import { useIdleDetection } from './hooks/useIdleDetection'
import { useSettings } from '../../shared/useSettings'
import OptionsModal from '../block-shapes/components/OptionsModal'

type ClaireWorldProps = {
  onBack: () => void
}

const GAME_OVER_FLAVORS = [
  "That's it. That's the whole game.",
  "Oof. At least you tried?",
  "Claire has seen enough.",
  "Game over. Go touch grass.",
  "Bestie... we need to talk.",
]

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function ClaireWorld({ onBack }: ClaireWorldProps) {
  const { state, tapCell, newGame, dispatch } = useGameState()
  const { settings, update: updateSettings } = useSettings()
  const [optionsOpen, setOptionsOpen] = useState(false)

  useAudio(state)
  useIdleDetection(state.modePhase, dispatch)

  const handleCellClick = useCallback((row: number, col: number) => {
    tapCell(row, col)
  }, [tapCell])

  const handleRestart = useCallback(() => {
    setOptionsOpen(false)
    newGame()
  }, [newGame])

  return (
    <div className="claire-world game-container">
      {/* Top bar */}
      <div className="top-bar">
        <button className="back-btn" onClick={onBack} aria-label="Back to menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="claire-score-area">
          <span className="claire-score">{state.score.toLocaleString('en-US')}</span>
          {state.highScore > 0 && (
            <span className="claire-high-score">Best: {state.highScore.toLocaleString('en-US')}</span>
          )}
        </div>

        <button
          className="options-btn"
          onClick={() => setOptionsOpen(true)}
          aria-label="Options"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Claire strip: avatar + speech bubble */}
      <ClaireStrip mood={state.claireMood} message={state.claireMessage} />

      {/* Board */}
      <div className="board-wrapper">
        <ClaireBoard board={state.board} onCellClick={handleCellClick} />
      </div>

      {/* Bottom controls */}
      <div className="claire-bottom-controls">
        <ModeIndicator mode={state.mode} />
        <MoodBar claireMultiplier={state.claireMultiplier} />
        <span className="claire-actions-remaining">
          {state.actionsRemaining} moves left
        </span>
      </div>

      {/* Game Over overlay */}
      {state.gameOver && (
        <div className="claire-game-over-overlay">
          <div className="claire-game-over-panel">
            <div className="claire-game-over-panel__flavor">
              {pickRandom(GAME_OVER_FLAVORS)}
            </div>
            <h1 className="claire-game-over-panel__title">Game Over</h1>
            <div className={`claire-game-over-panel__score${state.score >= state.highScore && state.score > 0 ? ' claire-game-over-panel__score--best' : ''}`}>
              {state.score >= state.highScore && state.score > 0 && (
                <div className="claire-game-over-panel__new-best">New Best!</div>
              )}
              {state.score.toLocaleString('en-US')}
            </div>
            <div className="claire-game-over-panel__high-score">
              Best: {state.highScore.toLocaleString('en-US')}
            </div>
            <div className="claire-game-over-panel__actions">
              <button className="claire-btn claire-btn--primary" onClick={newGame}>
                Play Again
              </button>
              <button className="claire-btn claire-btn--secondary" onClick={onBack}>
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Options modal (reused from block-shapes) */}
      {optionsOpen && (
        <OptionsModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setOptionsOpen(false)}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
