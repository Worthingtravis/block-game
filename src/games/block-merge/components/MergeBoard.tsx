import MergeCell from './MergeCell'
import type { Board, Cell, DropInfo } from '../game/types'
import { BOARD_SIZE } from '../game/types'

type MergeBoardProps = {
  board: Board
  onCellClick: (position: Cell) => void
  lastDrop?: DropInfo | null
  dropping?: boolean
  poppingSet?: Set<string>
  disabled?: boolean
}

export default function MergeBoard({
  board,
  onCellClick,
  lastDrop,
  dropping,
  poppingSet,
  disabled,
}: MergeBoardProps) {
  return (
    <div className="merge-board">
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE)
        const col = i % BOARD_SIZE
        const value = board[row][col]
        const key = `${row},${col}`
        const isMerging = poppingSet ? poppingSet.has(key) : false
        const isDropping = dropping && lastDrop && lastDrop.col === col && row === lastDrop.toRow && !isMerging
        const dropDist = isDropping ? lastDrop.toRow : 0
        return (
          <MergeCell
            key={`${row}-${col}`}
            value={value}
            merging={isMerging}
            dropping={!!isDropping}
            dropDistance={dropDist}
            onClick={disabled ? undefined : () => onCellClick({ row, col })}
          />
        )
      })}
    </div>
  )
}
