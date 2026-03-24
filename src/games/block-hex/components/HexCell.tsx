import { memo } from 'react'
import type { HexColor } from '../game/types'

export const COLOR_MAP: Record<HexColor, string> = {
  blue: '#4a90d9',
  red: '#f44336',
  yellow: '#ffdd44',
  green: '#4caf50',
  purple: '#9c27b0',
}

const DARK_MAP: Record<HexColor, string> = {
  blue: '#3a70b0',
  red: '#c62828',
  yellow: '#ccb030',
  green: '#388e3c',
  purple: '#7b1fa2',
}

type HexCellProps = {
  index: number
  stack: HexColor[]
  isMatching: boolean
  onClick: (index: number) => void
  row: number
}

const MAX_VISIBLE_LAYERS = 5
const LAYER_OFFSET = 3 // px per layer

const HexCell = memo(function HexCell({ index, stack, isMatching, onClick, row }: HexCellProps) {
  const isEmpty = stack.length === 0

  if (isEmpty) {
    return (
      <div
        className="hex-cell hex-cell--empty"
        onClick={() => onClick(index)}
        style={{ zIndex: row * 10 }}
        aria-label={`Cell ${index}, empty`}
      />
    )
  }

  const visibleLayers = stack.slice(-MAX_VISIBLE_LAYERS)

  return (
    <div
      className={`hex-cell hex-cell--stacked${isMatching ? ' hex-cell--matching' : ''}`}
      onClick={() => onClick(index)}
      style={{ zIndex: row * 10 + 5 }}
      aria-label={`Cell ${index}, ${stack[stack.length - 1]}, depth ${stack.length}`}
    >
      {visibleLayers.map((color, i) => {
        const isTop = i === visibleLayers.length - 1
        // Layers stack downward — bottom layers peek out below the top
        const offset = (visibleLayers.length - 1 - i) * LAYER_OFFSET
        return (
          <div
            key={i}
            className={`hex-layer${isTop ? ' hex-layer--top' : ''}`}
            style={{
              backgroundColor: isTop ? COLOR_MAP[color] : DARK_MAP[color],
              top: `${offset}px`,
              zIndex: visibleLayers.length - i,
              boxShadow: isTop
                ? '0 3px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)'
                : '0 2px 3px rgba(0,0,0,0.25)',
            }}
          />
        )
      })}
    </div>
  )
})

export default HexCell
