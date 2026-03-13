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
    const col = Math.floor(((clientX - rect.left - padding) / innerWidth) * BOARD_SIZE)
    const row = Math.floor(((clientY - rect.top - padding - FINGER_OFFSET) / innerHeight) * BOARD_SIZE)
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null
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
