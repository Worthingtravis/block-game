import { useState, useEffect, useCallback, useMemo } from 'react'
import Board from './Board'
import PieceQueue from './PieceQueue'
import ScoreDisplay from './ScoreDisplay'
import type { StoredGame } from '../persistence'
import { replayGameSteps } from '../persistence'
import { createEmptyBoard } from '../game/engine'
import { SHAPE_DEFINITIONS } from '../game/pieces'
import type { GameState, Piece } from '../game/types'

type GameReplayProps = {
  game: StoredGame
  onClose: () => void
}

export default function GameReplay({ game, onClose }: GameReplayProps) {
  const steps = useMemo(() => replayGameSteps(game), [game])

  const initialState: GameState = useMemo(() => {
    const pieces = game.initial_pieces.map(sp => {
      if (!sp) return null
      return { id: crypto.randomUUID(), shape: sp.shape, color: sp.color, cells: SHAPE_DEFINITIONS[sp.shape] } as Piece
    }) as [Piece | null, Piece | null, Piece | null]

    return {
      board: createEmptyBoard(),
      pieces,
      score: 0,
      highScore: 0,
      comboMultiplier: 1,
      bombs: 0,
      gameOver: false,
      lastClear: null,
    }
  }, [game])

  const [stepIndex, setStepIndex] = useState(-1)

  const currentState = stepIndex < 0 ? initialState : steps[stepIndex]?.state ?? initialState
  const totalMoves = steps.length

  const goBack = useCallback(() => {
    setStepIndex(prev => Math.max(-1, prev - 1))
  }, [])

  const goForward = useCallback(() => {
    setStepIndex(prev => Math.min(totalMoves - 1, prev + 1))
  }, [totalMoves])

  const goToStart = useCallback(() => setStepIndex(-1), [])
  const goToEnd = useCallback(() => setStepIndex(totalMoves - 1), [totalMoves])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goBack() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goForward() }
      else if (e.key === 'Home') { e.preventDefault(); goToStart() }
      else if (e.key === 'End') { e.preventDefault(); goToEnd() }
      else if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goBack, goForward, goToStart, goToEnd, onClose])

  const moveLabel = stepIndex < 0 ? 'Start' : `Move ${stepIndex + 1} / ${totalMoves}`
  const statusLabel = game.status === 'game_over' ? 'Game Over' : game.status === 'abandoned' ? 'Abandoned' : 'In Progress'

  return (
    <div className="game-container">
      <div className="top-bar">
        <button className="back-btn" onClick={onClose} aria-label="Close replay">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <ScoreDisplay
          score={currentState.score}
          highScore={game.score}
          comboMultiplier={currentState.comboMultiplier}
        />
      </div>

      <div className="replay-badge">{statusLabel} — Final: {game.score}</div>

      <div className="board-wrapper">
        <Board board={currentState.board} />
      </div>

      <PieceQueue
        pieces={currentState.pieces}
        onDragStart={() => { /* replay mode — no drag */ }}
      />

      <div className="replay-controls">
        <button className="replay-btn" onClick={goToStart} disabled={stepIndex < 0} aria-label="Go to start">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button className="replay-btn" onClick={goBack} disabled={stepIndex < 0} aria-label="Previous move">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <span className="replay-label">{moveLabel}</span>
        <button className="replay-btn" onClick={goForward} disabled={stepIndex >= totalMoves - 1} aria-label="Next move">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>
        <button className="replay-btn" onClick={goToEnd} disabled={stepIndex >= totalMoves - 1} aria-label="Go to end">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>
    </div>
  )
}
