import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import Board from './components/Board'
import PieceQueue from './components/PieceQueue'
import PiecePreview from './components/PiecePreview'
import ScoreDisplay from './components/ScoreDisplay'
import GameOver from './components/GameOver'
import ParticleCanvas from './components/ParticleCanvas'
import OptionsModal from './components/OptionsModal'
import type { ParticleCanvasHandle } from './components/ParticleCanvas'
import type { Piece } from './game/types'
import { useGameState } from './hooks/useGameState'
import { useDragDrop } from './hooks/useDragDrop'
import { useAudio } from './hooks/useAudio'
import { useBoardEffects } from './hooks/useBoardEffects'
import { useSettings } from './hooks/useSettings'
import { playPickUp, playPlace, playInvalidDrop } from './audio/sounds'
import { vibratePlace } from './audio/haptics'

export default function App() {
  const { state, placePiece, newGame } = useGameState()
  const { settings, update: updateSettings } = useSettings()
  const boardRef = useRef<HTMLDivElement>(null)
  const particleRef = useRef<ParticleCanvasHandle>(null)
  const [boardSize, setBoardSize] = useState({ width: 400, height: 400 })
  const [optionsOpen, setOptionsOpen] = useState(false)

  useAudio(state)

  const { shaking, clearingCells } = useBoardEffects({
    lastClear: state.lastClear,
    boardRef,
    particleRef,
  })

  const { dragState, dragPosition, draggedPiece, handleDragStart: rawDragStart, handlePointerMove, handlePointerUp: rawPointerUp } =
    useDragDrop({
      board: state.board,
      onDrop: (pieceIndex, position) => {
        playPlace()
        vibratePlace()
        placePiece(pieceIndex, position)
      },
      boardRef,
    })

  const handleDragStart = useCallback((index: number, piece: Piece) => {
    playPickUp()
    rawDragStart(index, piece)
  }, [rawDragStart])

  const handlePointerUp = useCallback(() => {
    if (dragState.draggedPieceIndex !== null && dragState.hoverPosition && dragState.placementValidity === false) {
      playInvalidDrop()
    }
    rawPointerUp()
  }, [rawPointerUp, dragState.draggedPieceIndex, dragState.hoverPosition, dragState.placementValidity])

  useEffect(() => {
    const onMove = (e: PointerEvent) => handlePointerMove(e)
    const onUp = () => handlePointerUp()
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [handlePointerMove, handlePointerUp])

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

  const previewCells = useMemo(() => {
    if (!dragState.hoverPosition || !draggedPiece) return undefined
    return draggedPiece.cells.map(c => ({
      row: dragState.hoverPosition!.row + c.row,
      col: dragState.hoverPosition!.col + c.col,
    }))
  }, [dragState.hoverPosition, draggedPiece])

  const handleRestart = useCallback(() => {
    setOptionsOpen(false)
    newGame()
  }, [newGame])

  return (
    <div className="game-container">
      <div className="top-bar">
        <ScoreDisplay
          score={state.score}
          highScore={state.highScore}
          comboMultiplier={state.comboMultiplier}
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

      <div
        ref={boardRef}
        className={`board-wrapper${shaking ? ' board--shaking' : ''}`}
      >
        <Board
          board={state.board}
          previewCells={previewCells}
          previewColor={draggedPiece?.color}
          previewValid={dragState.placementValidity}
          clearingCells={clearingCells.length > 0 ? clearingCells : undefined}
        />
        <ParticleCanvas ref={particleRef} width={boardSize.width} height={boardSize.height} />
      </div>

      <PieceQueue
        pieces={state.pieces}
        onDragStart={handleDragStart}
      />

      {dragPosition && draggedPiece && (
        <div
          className="drag-ghost"
          style={{ left: dragPosition.x, top: dragPosition.y }}
        >
          <PiecePreview piece={draggedPiece} />
        </div>
      )}

      {state.gameOver && (
        <GameOver
          score={state.score}
          highScore={state.highScore}
          onNewGame={newGame}
        />
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
