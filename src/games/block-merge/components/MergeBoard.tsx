import MergeCell from './MergeCell'
import type { Board, MergeResult, Phase } from '../game/types'
import { BOARD_SIZE } from '../game/types'

type MergeBoardProps = {
  board: Board
  onCellClick: (col: number) => void
  phase: Phase
  currentMerge?: MergeResult | null
  dropCol?: number | null
  disabled?: boolean
}

export default function MergeBoard({ board, onCellClick, phase, currentMerge, dropCol, disabled }: MergeBoardProps) {
  return (
    <div className="merge-board">
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE)
        const col = i % BOARD_SIZE
        const value = board[row][col]

        const isMergeResult = phase === 'merging' && currentMerge &&
          currentMerge.resultCell.row === row && currentMerge.resultCell.col === col

        const isDropping = phase === 'dropping' && dropCol === col &&
          value !== null && (row === 0 || board[row - 1]?.[col] === null)

        return (
          <MergeCell
            key={`${row}-${col}`}
            value={value}
            merging={!!isMergeResult}
            dropping={!!isDropping}
            onClick={disabled || phase !== 'idle' ? undefined : () => onCellClick(col)}
          />
        )
      })}
    </div>
  )
}
