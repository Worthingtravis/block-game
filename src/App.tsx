import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import Board from './components/Board'
import Cell from './components/Cell'
import PieceQueue from './components/PieceQueue'
import ScoreDisplay from './components/ScoreDisplay'
import GameOver from './components/GameOver'
import ParticleCanvas from './components/ParticleCanvas'
import type { ParticleCanvasHandle } from './components/ParticleCanvas'
import { BOARD_SIZE } from './game/types'
import type { Cell as CellType } from './game/types'
import { useGameState } from './hooks/useGameState'
import { useDragDrop } from './hooks/useDragDrop'
import { useAudio } from './hooks/useAudio'
import { playPickUp, playPlace, playInvalidDrop } from './audio/sounds'
import type { Piece } from './game/types'

export default function App() {
  const { state, placePiece, newGame } = useGameState()
  const boardRef = useRef<HTMLDivElement>(null)
  const particleRef = useRef<ParticleCanvasHandle>(null)
  const [boardSize, setBoardSize] = useState({ width: 400, height: 400 })
  const [shaking, setShaking] = useState(false)
  const [clearingCells, setClearingCells] = useState<CellType[]>([])

  useAudio(state)

  const { dragState, dragPosition, draggedPiece, handleDragStart: rawDragStart, handlePointerMove, handlePointerUp: rawPointerUp } =
    useDragDrop({
      board: state.board,
      onDrop: (pieceIndex, position) => {
        playPlace()
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

  // Track board dimensions for particle canvas
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

  // Emit particles on line clear
  useEffect(() => {
    const clear = state.lastClear
    if (!clear || clear.linesCleared === 0) return
    const el = boardRef.current
    if (!el || !particleRef.current) return

    const rect = el.getBoundingClientRect()
    const padding = parseFloat(getComputedStyle(el).padding) || 6
    const cellW = (rect.width - padding * 2) / BOARD_SIZE
    const cellH = (rect.height - padding * 2) / BOARD_SIZE

    for (const cell of clear.clearedCells) {
      const x = padding + cell.col * cellW + cellW / 2
      const y = padding + cell.row * cellH + cellH / 2
      particleRef.current.emit(x, y, '#ffffff', clear.linesCleared >= 2 ? 6 : 3)
    }
  }, [state.lastClear])

  // Track clearing cells with timed cleanup so animation doesn't permanently hide them
  useEffect(() => {
    if (state.lastClear && state.lastClear.linesCleared > 0) {
      setClearingCells(state.lastClear.clearedCells)
      const timer = setTimeout(() => setClearingCells([]), 300)
      return () => clearTimeout(timer)
    }
  }, [state.lastClear])

  // Screen shake on multi-line clears
  useEffect(() => {
    if (state.lastClear && state.lastClear.linesCleared >= 2) {
      setShaking(true)
      const timer = setTimeout(() => setShaking(false), 200)
      return () => clearTimeout(timer)
    }
  }, [state.lastClear])

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

      <div
        ref={boardRef}
        className={shaking ? 'board--shaking' : ''}
        style={{ width: '100%', maxWidth: '400px', position: 'relative' }}
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
