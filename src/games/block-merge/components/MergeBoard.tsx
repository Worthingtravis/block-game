import { useMemo } from 'react'
import MergeCell from './MergeCell'
import type { Board, Cell, MergeResult } from '../game/types'
import { BOARD_SIZE } from '../game/types'

type MergeBoardProps = {
  board: Board
  onCellClick: (position: Cell) => void
  lastMerges?: MergeResult[] | null
  disabled?: boolean
}

export default function MergeBoard({ board, onCellClick, lastMerges, disabled }: MergeBoardProps) {
  const mergingSet = useMemo(() => {
    if (!lastMerges || lastMerges.length === 0) return new Set<string>()
    const set = new Set<string>()
    for (const merge of lastMerges) {
      set.add(`${merge.resultCell.row},${merge.resultCell.col}`)
    }
    return set
  }, [lastMerges])

  return (
    <div className="merge-board">
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
        const row = Math.floor(i / BOARD_SIZE)
        const col = i % BOARD_SIZE
        const value = board[row][col]
        const isMerging = mergingSet.has(`${row},${col}`)
        return (
          <MergeCell
            key={`${row}-${col}`}
            value={value}
            highlight={isMerging}
            onClick={disabled ? undefined : () => onCellClick({ row, col })}
          />
        )
      })}
    </div>
  )
}
