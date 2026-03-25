import type { Board } from '../game/types'
import { BOARD_SIZE } from '../game/types'
import ClaireCell from './ClaireCell'

type Props = {
  board: Board
  onCellClick: (row: number, col: number) => void
  clearOrigin?: { row: number; col: number } | null
}

export default function ClaireBoard({ board, onCellClick, clearOrigin }: Props) {
  return (
    <div
      className="claire-board"
      style={{ '--claire-board-size': BOARD_SIZE } as React.CSSProperties}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          // Stagger delay based on distance from clear origin
          let entryDelay = 0
          if (clearOrigin) {
            const dist = Math.abs(r - clearOrigin.row) + Math.abs(c - clearOrigin.col)
            entryDelay = dist * 0.04
          }
          return (
            <ClaireCell
              key={`${r}-${c}-${cell.color ?? 'empty'}`}
              cell={cell}
              row={r}
              col={c}
              onCellClick={onCellClick}
              entryDelay={entryDelay}
            />
          )
        })
      )}
    </div>
  )
}
