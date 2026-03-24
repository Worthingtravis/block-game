import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import Board from './components/Board'
import PieceQueue from './components/PieceQueue'
import PiecePreview from './components/PiecePreview'
import ScoreDisplay from './components/ScoreDisplay'
import GameOver from './components/GameOver'
import ParticleCanvas from './components/ParticleCanvas'
import Affirmations from './components/Affirmations'
import OptionsModal from './components/OptionsModal'
import GameReplay from './components/GameReplay'
import type { ParticleCanvasHandle } from './components/ParticleCanvas'
import type { Piece } from './game/types'
import { BOARD_SIZE } from './game/types'
import { useGameState } from './hooks/useGameState'
import { useDragDrop } from './hooks/useDragDrop'
import { useAudio } from './hooks/useAudio'
import { loadGameLocally } from './persistence'
import { useBoardEffects } from './hooks/useBoardEffects'
import { useSettings } from './hooks/useSettings'
import { playPickUp, playPlace, playInvalidDrop, playBombExplode } from './audio/sounds'
import { vibratePlace } from './audio/haptics'

import type { GameSyncService } from './game-sync'

type BlockShapesProps = {
  onBack: () => void
  syncService?: GameSyncService | null
}

const FINGER_OFFSET = 50

export default function BlockShapes({ onBack, syncService }: BlockShapesProps) {
  const { state, placePiece, useBomb, newGame } = useGameState({ syncService })
  const { settings, update: updateSettings } = useSettings()
  const boardRef = useRef<HTMLDivElement>(null)
  const particleRef = useRef<ParticleCanvasHandle>(null)
  const [boardSize, setBoardSize] = useState({ width: 400, height: 400 })
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [replayGame, setReplayGame] = useState<import('./persistence').StoredGame | null>(null)
  const maxComboRef = useRef(1)

  // Bomb drag state
  const [bombDragging, setBombDragging] = useState(false)
  const [bombDragPos, setBombDragPos] = useState<{ x: number; y: number } | null>(null)
  const [bombHoverCell, setBombHoverCell] = useState<{ row: number; col: number } | null>(null)

  if (state.comboMultiplier > maxComboRef.current) maxComboRef.current = state.comboMultiplier
  if (state.score === 0) maxComboRef.current = 1

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

  const handleDragStart = useCallback((index: number, piece: Piece, clientX: number, clientY: number) => {
    if (bombDragging) return
    playPickUp()
    rawDragStart(index, piece, clientX, clientY)
  }, [rawDragStart, bombDragging])

  const handlePointerUp = useCallback(() => {
    if (dragState.draggedPieceIndex !== null && dragState.hoverPosition && dragState.placementValidity === false) {
      playInvalidDrop()
    }
    rawPointerUp()
  }, [rawPointerUp, dragState.draggedPieceIndex, dragState.hoverPosition, dragState.placementValidity])

  // Piece drag listeners
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

  // Board resize observer
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

  // Bomb drag helpers
  const getBombCell = useCallback((clientX: number, clientY: number) => {
    const el = boardRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const padding = parseFloat(getComputedStyle(el).padding) || 6
    const innerW = rect.width - padding * 2
    const innerH = rect.height - padding * 2
    const col = Math.floor(((clientX - rect.left - padding) / innerW) * BOARD_SIZE)
    const row = Math.floor(((clientY - rect.top - padding - FINGER_OFFSET) / innerH) * BOARD_SIZE)
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null
    return { row, col }
  }, [])

  const handleBombPointerDown = useCallback((e: React.PointerEvent) => {
    if (state.bombs <= 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setBombDragging(true)
    setBombDragPos({ x: e.clientX, y: e.clientY - FINGER_OFFSET })
    setBombHoverCell(getBombCell(e.clientX, e.clientY))
  }, [state.bombs, getBombCell])

  // Bomb drag move/up listeners
  useEffect(() => {
    if (!bombDragging) return
    const onMove = (e: PointerEvent) => {
      setBombDragPos({ x: e.clientX, y: e.clientY - FINGER_OFFSET })
      setBombHoverCell(getBombCell(e.clientX, e.clientY))
    }
    const onUp = () => {
      if (bombHoverCell) {
        playBombExplode()
        vibratePlace()
        useBomb(bombHoverCell)
      }
      setBombDragging(false)
      setBombDragPos(null)
      setBombHoverCell(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [bombDragging, bombHoverCell, getBombCell, useBomb])

  // Piece preview cells
  const previewCells = useMemo(() => {
    if (!dragState.hoverPosition || !draggedPiece) return undefined
    return draggedPiece.cells.map(c => ({
      row: dragState.hoverPosition!.row + c.row,
      col: dragState.hoverPosition!.col + c.col,
    }))
  }, [dragState.hoverPosition, draggedPiece])

  // Bomb cross-hair preview: full row + column
  const bombPreviewCells = useMemo(() => {
    if (!bombHoverCell) return undefined
    const cells: { row: number; col: number }[] = []
    for (let c = 0; c < BOARD_SIZE; c++) cells.push({ row: bombHoverCell.row, col: c })
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (r !== bombHoverCell.row) cells.push({ row: r, col: bombHoverCell.col })
    }
    return cells
  }, [bombHoverCell])

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
          previewCells={bombDragging ? bombPreviewCells : previewCells}
          previewColor={bombDragging ? 'red' : draggedPiece?.color}
          previewValid={bombDragging ? (bombHoverCell ? true : null) : dragState.placementValidity}
          clearingCells={clearingCells.length > 0 ? clearingCells : undefined}
        />
        <ParticleCanvas ref={particleRef} width={boardSize.width} height={boardSize.height} />
        <Affirmations lastClear={state.lastClear} comboMultiplier={state.comboMultiplier} />
      </div>

      <div className="bottom-controls">
        <PieceQueue
          pieces={state.pieces}
          onDragStart={handleDragStart}
        />
        {state.bombs > 0 && (
          <div
            className={`bomb-btn${bombDragging ? ' bomb-btn--active' : ''}`}
            onPointerDown={handleBombPointerDown}
            style={{ touchAction: 'none' }}
          >
            <span className="bomb-btn__icon">💣</span>
            <span className="bomb-btn__count">{state.bombs}</span>
          </div>
        )}
      </div>

      {/* Piece drag ghost */}
      {dragPosition && draggedPiece && (
        <div
          className="drag-ghost"
          style={{ left: dragPosition.x, top: dragPosition.y }}
        >
          <PiecePreview piece={draggedPiece} />
        </div>
      )}

      {/* Bomb drag ghost */}
      {bombDragPos && (
        <div
          className="drag-ghost bomb-ghost"
          style={{ left: bombDragPos.x, top: bombDragPos.y }}
        >
          💣
        </div>
      )}

      {state.gameOver && !reviewing && (
        <GameOver
          score={state.score}
          highScore={state.highScore}
          onNewGame={newGame}
          maxCombo={maxComboRef.current}
          moveCount={loadGameLocally()?.moves.length}
          onReview={() => {
            const saved = loadGameLocally()
            if (saved) { setReplayGame(saved); setReviewing(true) }
          }}
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

      {reviewing && replayGame && (
        <GameReplay game={replayGame} onClose={() => { setReviewing(false); setReplayGame(null) }} />
      )}
    </div>
  )
}
