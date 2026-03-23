import type { Piece } from '../game/types'
import PiecePreview from './PiecePreview'

type DraggablePieceProps = {
  piece: Piece | null
  index: number
  onDragStart: (index: number, piece: Piece) => void
  cellSize?: number
}

export default function DraggablePiece({ piece, index, onDragStart, cellSize = 28 }: DraggablePieceProps) {
  if (!piece) {
    return <div className="piece-slot piece-slot--empty" />
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    onDragStart(index, piece)
  }

  return (
    <div className="piece-slot" onPointerDown={handlePointerDown}>
      <PiecePreview piece={piece} cellSize={cellSize} />
    </div>
  )
}
