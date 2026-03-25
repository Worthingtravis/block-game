import type { Board } from '../game/types'
import { BOARD_SIZE } from '../game/types'
import ClaireCell from './ClaireCell'

type Props = {
  board: Board
  onCellClick: (row: number, col: number) => void
}

export default function ClaireBoard({ board, onCellClick }: Props) {
  return (
    <div
      className="claire-board"
      style={{ '--claire-board-size': BOARD_SIZE } as React.CSSProperties}
      aria-label="Claire's World game board"
    >
      {board.map((row, r) =>
        row.map((cell, c) => (
          <ClaireCell
            key={`${r}-${c}`}
            cell={cell}
            row={r}
            col={c}
            onCellClick={onCellClick}
          />
        ))
      )}
    </div>
  )
}
