import { useRef, useEffect, useMemo, useCallback } from 'react'
import Board from './components/Board'
import Cell from './components/Cell'
import PieceQueue from './components/PieceQueue'
import ScoreDisplay from './components/ScoreDisplay'
import GameOver from './components/GameOver'
import { useGameState } from './hooks/useGameState'
import { useDragDrop } from './hooks/useDragDrop'
import type { Piece } from './game/types'

export default function App() {
  const { state, placePiece, newGame } = useGameState()
  const boardRef = useRef<HTMLDivElement>(null)

  const { dragState, dragPosition, draggedPiece, handleDragStart: rawDragStart, handlePointerMove, handlePointerUp: rawPointerUp } =
    useDragDrop({
      board: state.board,
      onDrop: placePiece,
      boardRef,
    })

  const handleDragStart = useCallback((index: number, piece: Piece) => {
    rawDragStart(index, piece)
  }, [rawDragStart])

  const handlePointerUp = useCallback(() => {
    rawPointerUp()
  }, [rawPointerUp])

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

  const previewCells = useMemo(() => {
    if (!dragState.hoverPosition || !draggedPiece) return undefined
    return draggedPiece.cells.map(c => ({
      row: dragState.hoverPosition!.row + c.row,
      col: dragState.hoverPosition!.col + c.col,
    }))
  }, [dragState.hoverPosition, draggedPiece])

  return (
    <div className="game-container">
      <ScoreDisplay
        score={state.score}
        highScore={state.highScore}
        comboMultiplier={state.comboMultiplier}
      />

      <div ref={boardRef} style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        <Board
          board={state.board}
          previewCells={previewCells}
          previewColor={draggedPiece?.color}
          previewValid={dragState.placementValidity}
          clearingCells={state.lastClear?.clearedCells}
        />
      </div>

      <PieceQueue
        pieces={state.pieces}
        onDragStart={handleDragStart}
      />

      {dragPosition && draggedPiece && (
        <div
          style={{
            position: 'fixed',
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%) scale(1.1)',
            pointerEvents: 'none',
            zIndex: 50,
            opacity: 0.8,
          }}
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
    </div>
  )
}

function PiecePreview({ piece }: { piece: Piece }) {
  const maxRow = Math.max(...piece.cells.map(c => c.row)) + 1
  const maxCol = Math.max(...piece.cells.map(c => c.col)) + 1
  const cellSet = new Set(piece.cells.map(c => `${c.row},${c.col}`))
  const size = 32

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${maxCol}, ${size}px)`,
        gap: '3px',
      }}
    >
      {Array.from({ length: maxRow * maxCol }, (_, i) => {
        const r = Math.floor(i / maxCol)
        const c = i % maxCol
        const filled = cellSet.has(`${r},${c}`)
        return filled ? (
          <Cell key={`${r}-${c}`} color={piece.color} size={size} />
        ) : (
          <div key={`${r}-${c}`} style={{ width: size, height: size }} />
        )
      })}
    </div>
  )
}
