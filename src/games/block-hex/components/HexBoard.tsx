import type { Board, MatchResult } from '../game/types'
import HexCell from './HexCell'

const ROWS = [
  [0, 1, 2],
  [3, 4, 5, 6],
  [7, 8, 9, 10, 11],
  [12, 13, 14, 15],
  [16, 17, 18],
]

const MAX_COLS = 5 // widest row

type HexBoardProps = {
  board: Board
  lastMatch: MatchResult | null
  onCellClick: (index: number) => void
}

/**
 * Calculate pixel position for each hex cell in a flat-top honeycomb layout.
 *
 * For a flat-top hex with width W:
 *   H = W * (2 / sqrt(3)) ≈ W * 1.1547
 *   Row vertical spacing = H * 0.75 (rows interlock)
 *   Odd rows (1, 3) are offset left by W/2 relative to the widest row center.
 */
function hexPosition(row: number, col: number, rowLen: number) {
  // How many cells this row is missing vs the widest row
  const offset = (MAX_COLS - rowLen) / 2
  // x: shifted by offset, each cell is 1 hex-width apart
  // Use CSS custom property var(--hex-w) at runtime; here we return multipliers
  const x = (col + offset) // in units of hex-width
  const y = row            // in units of row-spacing (0.75 * hex-height)
  return { x, y }
}

export default function HexBoard({ board, lastMatch, onCellClick }: HexBoardProps) {
  const matchingSet = new Set(lastMatch?.cellIndices ?? [])

  return (
    <div className="hex-board">
      {ROWS.map((row, rowIndex) =>
        row.map((cellIndex, colIndex) => {
          const { x, y } = hexPosition(rowIndex, colIndex, row.length)
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
