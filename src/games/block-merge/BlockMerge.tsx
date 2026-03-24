import { useRef, useEffect, useState, useCallback } from 'react'
import MergeBoard from './components/MergeBoard'
import Affirmations from './components/Affirmations'
import NextQueue from './components/NextQueue'
import ParticleCanvas from '../block-shapes/components/ParticleCanvas'
import type { ParticleCanvasHandle } from '../block-shapes/components/ParticleCanvas'
import ScoreDisplay from '../block-shapes/components/ScoreDisplay'
import OptionsModal from '../block-shapes/components/OptionsModal'
import { useSettings } from '../block-shapes/hooks/useSettings'
import { useGameState } from './hooks/useGameState'
import { useAudio } from './hooks/useAudio'
import { BOARD_SIZE } from './game/types'
import { getValueColor, formatValue } from './game/values'

type BlockMergeProps = {
  onBack: () => void
}

export default function BlockMerge({ onBack }: BlockMergeProps) {
  const { state, placeBlock, newGame, dismissLevelUp } = useGameState()
  const { settings, update: updateSettings } = useSettings()
  const boardRef = useRef<HTMLDivElement>(null)
  const particleRef = useRef<ParticleCanvasHandle>(null)
  const [boardSize, setBoardSize] = useState({ width: 300, height: 300 })
  const [optionsOpen, setOptionsOpen] = useState(false)

  useAudio(state)

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setBoardSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Particles on merge
  useEffect(() => {
    if (state.phase !== 'merging' || !state.currentMerge) return
    const el = boardRef.current
    if (!el || !particleRef.current) return

    const rect = el.getBoundingClientRect()
    const padding = parseFloat(getComputedStyle(el).padding) || 6
    const cellW = (rect.width - padding * 2) / BOARD_SIZE
    const cellH = (rect.height - padding * 2) / BOARD_SIZE

    const merge = state.currentMerge
    const x = padding + merge.resultCell.col * cellW + cellW / 2
    const y = padding + merge.resultCell.row * cellH + cellH / 2
    const color = getValueColor(merge.resultValue)
    particleRef.current.emit(x, y, color, 8, 1.2)
  }, [state.phase, state.currentMerge])

  const handleRestart = useCallback(() => {
    setOptionsOpen(false)
    newGame()
  }, [newGame])

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
          comboMultiplier={state.chainStep > 0 ? state.chainStep : 1}
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
        <MergeBoard
          board={state.board}
          onCellClick={placeBlock}
          phase={state.phase}
          currentMerge={state.currentMerge}
          dropCell={state.dropCell}
          disabled={state.gameOver}
        />
        <Affirmations currentMerge={state.currentMerge} chainStep={state.chainStep} totalMerges={state.totalMerges} phase={state.phase} />
        <ParticleCanvas ref={particleRef} width={boardSize.width} height={boardSize.height} />
      </div>

      <NextQueue queue={state.queue} />

      {state.phase === 'levelup' && state.levelUpRemoved !== null && (
        <div className="game-over-overlay" onClick={dismissLevelUp}>
          <div className="game-over-panel level-up-panel">
            <h1>LEVEL UP!</h1>
            <div className="level-up-message">
              All <span className="level-up-value">{state.levelUpRemoved}s</span> have been eliminated!
            </div>
            <div className="level-up-sub">Minimum block is now {state.minValue}</div>
            <div className="level-up-tap">Tap to continue</div>
          </div>
        </div>
      )}

      {state.gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-panel">
            <h1>Game Over</h1>
            <div className="game-over-panel__score">Score: {state.score}</div>
            <div className="game-over-panel__best">Best: {state.highScore}</div>
            <div className="game-over-panel__stats">
              <span>Highest: {formatValue(state.highestTile)}</span>
              <span>{state.totalMerges} merges</span>
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
