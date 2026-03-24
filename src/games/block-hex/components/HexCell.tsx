import { memo } from 'react'
import type { HexCellVM } from '../block-hex.vm'
import { HEX_COLORS } from '../block-hex.vm'

const MAX_VISIBLE_LAYERS = 5
const LAYER_OFFSET = 4

const HexCell = memo(function HexCell({
  cell,
  onClick,
}: {
  cell: HexCellVM
  onClick: (index: number) => void
}) {
  const isEmpty = cell.stack.length === 0

  return (
    <div
      className="hex-cell-pos"
      style={{
        left: `calc(${cell.x} * var(--hex-w))`,
        top: `calc(${cell.y} * var(--hex-row-h))`,
        zIndex: cell.row * 10 + (isEmpty ? 0 : 5),
      }}
    >
      {isEmpty ? (
        <div
          className="hex-cell hex-cell--empty"
          onClick={() => onClick(cell.index)}
        />
      ) : (
        <div
          className={`hex-cell hex-cell--filled${cell.isMatching ? ' hex-cell--matching' : ''}`}
          onClick={() => onClick(cell.index)}
        >
          {cell.stack.slice(-MAX_VISIBLE_LAYERS).map((color, i, arr) => {
            const isTop = i === arr.length - 1
            const depth = (arr.length - 1 - i) * LAYER_OFFSET
            const colors = HEX_COLORS[color]
            return (
              <div
                key={i}
                className={`hex-disc${isTop ? ' hex-disc--top' : ''}`}
                style={{
                  '--disc-face': colors.face,
                  '--disc-edge': colors.edge,
                  '--disc-border': colors.border,
                  '--disc-glow': colors.glow,
                  '--disc-depth': `${depth}px`,
                } as React.CSSProperties}
              />
            )
          })}
        </div>
      )}
    </div>
  )
})

export default HexCell
