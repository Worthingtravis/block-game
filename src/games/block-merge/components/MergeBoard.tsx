import { useState, useCallback } from 'react'
import MergeCell from './MergeCell'
import type { Board, MergeResult, Phase } from '../game/types'
import { BOARD_SIZE } from '../game/types'

type MergeBoardProps = {
  board: Board
  onCellClick: (col: number) => void
  phase: Phase
  currentMerge?: MergeResult | null
  dropCell?: { row: number; col: number } | null
  disabled?: boolean
}

export default function MergeBoard({ board, onCellClick, phase, currentMerge, dropCell, disabled }: MergeBoardProps) {
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const interactive = !disabled && phase === 'idle'

  const handleMouseEnter = useCallback((col: number) => {
    setHoverCol(col)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoverCol(null)
  }, [])

  return (
    <div className="merge-board" onMouseLeave={handleMouseLeave}>
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE)
        const col = i % BOARD_SIZE
        const value = board[row][col]

        const isMergeResult = phase === 'merging' && currentMerge &&
          currentMerge.resultCell.row === row && currentMerge.resultCell.col === col

        const isDropping = phase === 'dropping' && dropCell &&
          dropCell.row === row && dropCell.col === col

        const columnHighlight = interactive && hoverCol === col && value === null

        return (
          <MergeCell
            key={`${row}-${col}`}
            value={value}
            merging={!!isMergeResult}
            dropping={!!isDropping}
            columnHighlight={columnHighlight}
            onClick={interactive ? () => onCellClick(col) : undefined}
            onMouseEnter={interactive ? () => handleMouseEnter(col) : undefined}
          />
        )
      })}
    </div>
  )
}
