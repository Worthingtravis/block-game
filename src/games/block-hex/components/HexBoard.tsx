import type { Board, MatchResult } from '../game/types'
import HexCell from './HexCell'

const ROWS = [
  [0, 1, 2],
  [3, 4, 5, 6],
  [7, 8, 9, 10, 11],
  [12, 13, 14, 15],
  [16, 17, 18],
]

// Horizontal offset for each row (in half-hex-widths from the left)
// Widest row (5) = 0 offset, 4-cell rows offset by 0.5, 3-cell rows by 1
const ROW_OFFSETS = [1, 0.5, 0, 0.5, 1]

type HexBoardProps = {
  board: Board
  lastMatch: MatchResult | null
  onCellClick: (index: number) => void
}

export default function HexBoard({ board, lastMatch, onCellClick }: HexBoardProps) {
  const matchingSet = new Set(lastMatch?.cellIndices ?? [])

  return (
    <div className="hex-board">
      {ROWS.map((row, rowIndex) =>
        row.map((cellIndex, colIndex) => {
          const xOffset = ROW_OFFSETS[rowIndex]
          const x = colIndex + xOffset
          const y = rowIndex
          return (
            <div
              key={cellIndex}
              className="hex-cell-wrapper"
              style={{
                left: `calc(${x} * var(--hex-w))`,
                top: `calc(${y} * var(--hex-row-h))`,
              }}
            >
              <HexCell
                index={cellIndex}
                stack={board[cellIndex] ?? []}
                isMatching={matchingSet.has(cellIndex)}
                onClick={onCellClick}
              />
            </div>
          )
        })
      )}
    </div>
  )
}
