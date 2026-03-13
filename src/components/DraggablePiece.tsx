import type { Piece } from '../game/types'
import Cell from './Cell'

type DraggablePieceProps = {
  piece: Piece | null
  index: number
  onDragStart: (index: number, piece: Piece) => void
  cellSize?: number
}

export default function DraggablePiece({ piece, index, onDragStart, cellSize = 28 }: DraggablePieceProps) {
  if (!piece) {
    return <div className="piece-slot piece-slot--empty" style={{ width: 80, height: 80 }} />
  }

  const maxRow = Math.max(...piece.cells.map(c => c.row)) + 1
  const maxCol = Math.max(...piece.cells.map(c => c.col)) + 1
  const cellSet = new Set(piece.cells.map(c => `${c.row},${c.col}`))

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    onDragStart(index, piece)
  }

  return (
    <div
      className="piece-slot"
      onPointerDown={handlePointerDown}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${maxCol}, ${cellSize}px)`,
        gap: '2px',
        padding: '8px',
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      {Array.from({ length: maxRow }, (_, r) =>
        Array.from({ length: maxCol }, (_, c) => {
          const filled = cellSet.has(`${r},${c}`)
          return (
            <div
              key={`${r}-${c}`}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 'var(--cell-radius)',
                background: filled ? 'transparent' : 'transparent',
              }}
            >
              {filled && <Cell color={piece.color} size={cellSize} />}
            </div>
          )
        })
      ).flat()}
    </div>
  )
}
