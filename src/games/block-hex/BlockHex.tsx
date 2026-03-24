import { useState, useRef } from 'react'
import HexBoard from './components/HexBoard'
import TileQueue from './components/TileQueue'
import Affirmations from './components/Affirmations'
import ParticleCanvas from '../block-shapes/components/ParticleCanvas'
import ScoreDisplay from '../block-shapes/components/ScoreDisplay'
import OptionsModal from '../block-shapes/components/OptionsModal'
import { useGameState } from './hooks/useGameState'
import { useAudio } from './hooks/useAudio'
import { useSettings } from '../../shared/useSettings'

type BlockHexProps = {
  onBack: () => void
}

export default function BlockHex({ onBack }: BlockHexProps) {
  const { state, placeTileAt: placeTile, newGame } = useGameState()
  const { settings, update: updateSettings } = useSettings()
  const [optionsOpen, setOptionsOpen] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)

  useAudio(state)

  const handleRestart = () => {
    setOptionsOpen(false)
    newGame()
  }

  return (
    <div className="game-container">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack} aria-label="Back to menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <ScoreDisplay
          score={state.score}
          highScore={state.highScore}
          comboMultiplier={state.chainStep > 0 ? state.chainStep + 1 : 1}
        />
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

      <div ref={boardRef} className="board-wrapper">
        <HexBoard
          board={state.board}
          lastMatch={state.lastMatch}
          onCellClick={placeTile}
        />
        <ParticleCanvas ref={null} width={400} height={500} />
        <Affirmations lastMatch={state.lastMatch} />
      </div>

      <div className="bottom-controls">
        <TileQueue queue={state.queue} />
      </div>

      {state.gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-panel">
            {state.score >= state.highScore && state.score > 0 && (
              <div className="game-over-panel__crown">New Best!</div>
            )}
            <h1>Game Over</h1>
            <div className={`game-over-panel__score${state.score >= state.highScore && state.score > 0 ? ' game-over-panel__score--best' : ''}`}>
              Score: {state.score}
            </div>
            <div className="game-over-panel__best">Best: {state.highScore}</div>
            <div className="game-over-panel__stats">
              <span>{state.totalClears} clears</span>
            </div>
            <div className="game-over-panel__actions">
              <button onClick={newGame}>Play Again</button>
            </div>
          </div>
        </div>
      )}

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
