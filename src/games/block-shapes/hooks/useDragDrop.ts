import { useState, useCallback, useRef, useEffect } from 'react'
import type { Cell, DragState, Piece, Board } from '../game/types'
import { BOARD_SIZE } from '../game/types'
import { isValidPlacement } from '../game/engine'

const DRAG_THRESHOLD = 8
const FINGER_OFFSET = 50

type UseDragDropOptions = {
  board: Board
  onDrop: (pieceIndex: number, position: Cell) => void
  boardRef: React.RefObject<HTMLDivElement | null>
}

type PieceMetrics = {
  rowOffset: number
  colOffset: number
  maxRow: number
  maxCol: number
  halfCount: number
}

function computePieceMetrics(piece: Piece): PieceMetrics {
  const maxPieceRow = Math.max(...piece.cells.map(c => c.row))
  const maxPieceCol = Math.max(...piece.cells.map(c => c.col))
  return {
    rowOffset: maxPieceRow / 2,
    colOffset: maxPieceCol / 2,
    maxRow: BOARD_SIZE - 1 - maxPieceRow,
    maxCol: BOARD_SIZE - 1 - maxPieceCol,
    halfCount: piece.cells.length / 2,
  }
}

export function useDragDrop({ board, onDrop, boardRef }: UseDragDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    draggedPieceIndex: null,
    hoverPosition: null,
    placementValidity: null,
  })
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null)

  const dragPieceRef = useRef<Piece | null>(null)
  const dragPieceIndexRef = useRef<number | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)
  const pieceMetricsRef = useRef<PieceMetrics | null>(null)
  const boardPaddingRef = useRef(6)

  const dragStateRef = useRef(dragState)
  const onDropRef = useRef(onDrop)
  useEffect(() => { dragStateRef.current = dragState }, [dragState])
  useEffect(() => { onDropRef.current = onDrop }, [onDrop])

  const getBoardCell = useCallback((clientX: number, clientY: number): Cell | null => {
    const boardEl = boardRef.current
    if (!boardEl) return null
    const rect = boardEl.getBoundingClientRect()
    const padding = boardPaddingRef.current
    const innerWidth = rect.width - padding * 2
    const innerHeight = rect.height - padding * 2
    const m = pieceMetricsRef.current
    const rawCol = Math.floor(((clientX - rect.left - padding) / innerWidth) * BOARD_SIZE - (m?.colOffset ?? 0))
    const rawRow = Math.floor(((clientY - rect.top - padding - FINGER_OFFSET) / innerHeight) * BOARD_SIZE - (m?.rowOffset ?? 0))

    const maxRow = m?.maxRow ?? BOARD_SIZE - 1
    const maxCol = m?.maxCol ?? BOARD_SIZE - 1
    const row = Math.max(0, Math.min(rawRow, maxRow))
    const col = Math.max(0, Math.min(rawCol, maxCol))

    if (m && dragPieceRef.current) {
      const offBoard = dragPieceRef.current.cells.filter(c => {
        const r = rawRow + c.row
        const cc = rawCol + c.col
        return r < 0 || r >= BOARD_SIZE || cc < 0 || cc >= BOARD_SIZE
      }).length
      if (offBoard > m.halfCount) return null
    }

    return { row, col }
  }, [boardRef])

  const handleDragStart = useCallback((index: number, piece: Piece) => {
    dragPieceRef.current = piece
    dragPieceIndexRef.current = index
    startPosRef.current = null
    isDraggingRef.current = false
    pieceMetricsRef.current = computePieceMetrics(piece)
    // Cache board padding once at drag start
    const boardEl = boardRef.current
    if (boardEl) {
      boardPaddingRef.current = parseFloat(getComputedStyle(boardEl).padding) || 6
    }
    setDraggedPiece(piece)
    setDragState({
      draggedPieceIndex: index,
      hoverPosition: null,
      placementValidity: null,
    })
  }, [boardRef])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (dragPieceIndexRef.current === null) return

    if (!isDraggingRef.current) {
      if (!startPosRef.current) {
        startPosRef.current = { x: e.clientX, y: e.clientY }
        return
      }
      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return
      isDraggingRef.current = true
    }

    setDragPosition({ x: e.clientX, y: e.clientY - FINGER_OFFSET })

    const cell = getBoardCell(e.clientX, e.clientY)
    const piece = dragPieceRef.current
    if (cell && piece) {
      const valid = isValidPlacement(board, piece, cell)
      setDragState(prev => {
        if (prev.hoverPosition?.row === cell.row && prev.hoverPosition?.col === cell.col && prev.placementValidity === valid) {
          return prev
        }
        return { ...prev, hoverPosition: cell, placementValidity: valid }
      })
    } else {
      setDragState(prev => {
        if (prev.hoverPosition === null) return prev
        return { ...prev, hoverPosition: null, placementValidity: null }
      })
    }
  }, [board, getBoardCell])

  const handlePointerUp = useCallback(() => {
    const pieceIndex = dragPieceIndexRef.current
    const { hoverPosition, placementValidity } = dragStateRef.current
    if (pieceIndex !== null && hoverPosition && placementValidity) {
      onDropRef.current(pieceIndex, hoverPosition)
    }
    dragPieceRef.current = null
    dragPieceIndexRef.current = null
    startPosRef.current = null
    isDraggingRef.current = false
    pieceMetricsRef.current = null
    setDragPosition(null)
    setDraggedPiece(null)
    setDragState({
      draggedPieceIndex: null,
      hoverPosition: null,
      placementValidity: null,
    })
  }, [])

  return {
    dragState,
    dragPosition,
    draggedPiece,
    handleDragStart,
    handlePointerMove,
    handlePointerUp,
  }
}
