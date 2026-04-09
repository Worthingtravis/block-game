import { useState, useCallback } from 'react'
import MergeCell from './MergeCell'
import type { Board, MergeResult, Phase } from '../game/types'
import { BOARD_SIZE } from '../game/types'

type MergeBoardProps = {
  board: Board
  onCellClick: (col: number) => void
  onBombClick?: (row: number, col: number) => void
  phase: Phase
  currentMerge?: MergeResult | null
  dropCell?: { row: number; col: number } | null
  disabled?: boolean
}

export default function MergeBoard({ board, onCellClick, onBombClick, phase, currentMerge, dropCell, disabled }: MergeBoardProps) {
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null)
  const interactive = !disabled && phase === 'idle'
  const bombMode = phase === 'bomb-targeting'

  const handleMouseEnter = useCallback((col: number) => {
    setHoverCol(col)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoverCol(null)
    setHoverCell(null)
  }, [])

  const handleBombHover = useCallback((row: number, col: number) => {
    setHoverCell({ row, col })
  }, [])

  function isInBombRadius(row: number, col: number): boolean {
    if (!hoverCell) return false
    return Math.abs(row - hoverCell.row) <= 1 && Math.abs(col - hoverCell.col) <= 1
  }

  return (
    <div className={`merge-board${bombMode ? ' merge-board--bomb' : ''}`} onMouseLeave={handleMouseLeave}>
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE)
        const col = i % BOARD_SIZE
        const value = board[row][col]

        const isMergeResult = phase === 'merging' && currentMerge &&
          currentMerge.resultCell.row === row && currentMerge.resultCell.col === col

        const isDropping = phase === 'dropping' && dropCell &&
          dropCell.row === row && dropCell.col === col

        const columnHighlight = interactive && hoverCol === col && value === null
        const bombHighlight = bombMode && isInBombRadius(row, col)

        return (
          <MergeCell
            key={`${row}-${col}`}
            value={value}
            merging={!!isMergeResult}
            dropping={!!isDropping}
            columnHighlight={columnHighlight}
            bombHighlight={bombHighlight}
            onClick={bombMode ? () => onBombClick?.(row, col) : interactive ? () => onCellClick(col) : undefined}
            onMouseEnter={bombMode ? () => handleBombHover(row, col) : interactive ? () => handleMouseEnter(col) : undefined}
          />
        )
      })}
    </div>
  )
}
