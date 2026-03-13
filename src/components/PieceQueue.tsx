import type { Piece } from '../game/types'
import DraggablePiece from './DraggablePiece'

type PieceQueueProps = {
  pieces: [Piece | null, Piece | null, Piece | null]
  onDragStart: (index: number, piece: Piece) => void
}

export default function PieceQueue({ pieces, onDragStart }: PieceQueueProps) {
  return (
    <div
      className="piece-queue"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 0',
        width: '100%',
        maxWidth: '400px',
      }}
    >
      {pieces.map((piece, i) => (
        <DraggablePiece
          key={piece?.id ?? `empty-${i}`}
          piece={piece}
          index={i}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  )
}
