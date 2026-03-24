import { memo } from 'react'
import type { Piece } from '../game/types'
import Cell from './Cell'

type PiecePreviewProps = {
  piece: Piece
  cellSize?: number
}

export default memo(function PiecePreview({ piece, cellSize = 32 }: PiecePreviewProps) {
  const maxRow = Math.max(...piece.cells.map(c => c.row)) + 1
  const maxCol = Math.max(...piece.cells.map(c => c.col)) + 1
  const cellSet = new Set(piece.cells.map(c => `${c.row},${c.col}`))

  return (
    <div
      className="piece-preview"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${maxCol}, ${cellSize}px)`,
        gap: '3px',
      }}
    >
      {Array.from({ length: maxRow * maxCol }, (_, i) => {
        const r = Math.floor(i / maxCol)
        const c = i % maxCol
        const filled = cellSet.has(`${r},${c}`)
        return filled ? (
          <Cell key={`${r}-${c}`} color={piece.color} size={cellSize} />
        ) : (
          <div key={`${r}-${c}`} style={{ width: cellSize, height: cellSize }} />
        )
      })}
    </div>
  )
})
