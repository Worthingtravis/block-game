import type { Board, MatchResult } from '../game/types'
import HexCell from './HexCell'

const ROWS = [
  [0, 1, 2],
  [3, 4, 5, 6],
  [7, 8, 9, 10, 11],
  [12, 13, 14, 15],
  [16, 17, 18],
]

type HexBoardProps = {
  board: Board
  lastMatch: MatchResult | null
  onCellClick: (index: number) => void
}

export default function HexBoard({ board, lastMatch, onCellClick }: HexBoardProps) {
  const matchingSet = new Set(lastMatch?.cellIndices ?? [])

  return (
    <div className="hex-board">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="hex-row">
          {row.map(cellIndex => (
            <HexCell
              key={cellIndex}
              index={cellIndex}
              stack={board[cellIndex] ?? []}
              isMatching={matchingSet.has(cellIndex)}
              onClick={onCellClick}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
