import { useState, useCallback, useRef } from 'react'
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

export function useDragDrop({ board, onDrop, boardRef }: UseDragDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    draggedPieceIndex: null,
    hoverPosition: null,
    placementValidity: null,
  })

  const dragPieceRef = useRef<Piece | null>(null)
  const dragPieceIndexRef = useRef<number | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)

  const getBoardCell = useCallback((clientX: number, clientY: number): Cell | null => {
    const boardEl = boardRef.current
    if (!boardEl) return null
    const rect = boardEl.getBoundingClientRect()
    const padding = parseFloat(getComputedStyle(boardEl).padding) || 6
    const innerWidth = rect.width - padding * 2
    const innerHeight = rect.height - padding * 2
    // Offset by piece center so the cursor targets the middle of the piece, not its top-left
    const piece = dragPieceRef.current
    const pieceRowOffset = piece ? Math.max(...piece.cells.map(c => c.row)) / 2 : 0
    const pieceColOffset = piece ? Math.max(...piece.cells.map(c => c.col)) / 2 : 0
    const rawCol = Math.floor(((clientX - rect.left - padding) / innerWidth) * BOARD_SIZE - pieceColOffset)
    const rawRow = Math.floor(((clientY - rect.top - padding - FINGER_OFFSET) / innerHeight) * BOARD_SIZE - pieceRowOffset)

    // Clamp to board bounds, accounting for piece dimensions so it snaps
    // to the closest valid edge position when dragging near/outside borders
    const maxRow = piece ? BOARD_SIZE - 1 - Math.max(...piece.cells.map(c => c.row)) : BOARD_SIZE - 1
    const maxCol = piece ? BOARD_SIZE - 1 - Math.max(...piece.cells.map(c => c.col)) : BOARD_SIZE - 1
    const row = Math.max(0, Math.min(rawRow, maxRow))
    const col = Math.max(0, Math.min(rawCol, maxCol))

    // Cancel if majority of piece cells would be off-board at the raw (unclamped) position
    if (piece) {
      const offBoard = piece.cells.filter(c => {
        const r = rawRow + c.row
        const cc = rawCol + c.col
        return r < 0 || r >= BOARD_SIZE || cc < 0 || cc >= BOARD_SIZE
      }).length
      if (offBoard > piece.cells.length / 2) return null
    }

    return { row, col }
  }, [boardRef])

  const handleDragStart = useCallback((index: number, piece: Piece) => {
    dragPieceRef.current = piece
    dragPieceIndexRef.current = index
    startPosRef.current = null
    isDraggingRef.current = false
    setDragState({
      draggedPieceIndex: index,
      hoverPosition: null,
      placementValidity: null,
    })
  }, [])

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
      setDragState(prev => ({
        ...prev,
        hoverPosition: cell,
        placementValidity: valid,
      }))
    } else {
      setDragState(prev => ({
        ...prev,
        hoverPosition: null,
        placementValidity: null,
      }))
    }
  }, [board, getBoardCell])

  const handlePointerUp = useCallback(() => {
    const pieceIndex = dragPieceIndexRef.current
    const { hoverPosition, placementValidity } = dragState
    if (pieceIndex !== null && hoverPosition && placementValidity) {
      onDrop(pieceIndex, hoverPosition)
    }
    dragPieceRef.current = null
    dragPieceIndexRef.current = null
    startPosRef.current = null
    isDraggingRef.current = false
    setDragPosition(null)
    setDragState({
      draggedPieceIndex: null,
      hoverPosition: null,
      placementValidity: null,
    })
  }, [dragState, onDrop])

  return {
    dragState,
    dragPosition,
    draggedPiece: dragPieceRef.current,
    handleDragStart,
    handlePointerMove,
    handlePointerUp,
  }
}
