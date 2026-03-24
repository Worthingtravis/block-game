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
}

const MAX_VISIBLE_LAYERS = 5

const HexCell = memo(function HexCell({ index, stack, isMatching, onClick }: HexCellProps) {
  const isEmpty = stack.length === 0

  if (isEmpty) {
    return (
      <div
        className="hex-cell hex-cell--empty"
        onClick={() => onClick(index)}
        aria-label={`Cell ${index}, empty`}
      />
    )
  }

  // Show up to MAX_VISIBLE_LAYERS stacked behind the top
  const visibleLayers = stack.slice(-MAX_VISIBLE_LAYERS)

  return (
    <div
      className={`hex-cell hex-cell--stacked${isMatching ? ' hex-cell--matching' : ''}`}
      onClick={() => onClick(index)}
      aria-label={`Cell ${index}, ${stack[stack.length - 1]}, depth ${stack.length}`}
    >
      {visibleLayers.map((color, i) => {
        const isTop = i === visibleLayers.length - 1
        const offset = (visibleLayers.length - 1 - i) * 3
        return (
          <div
            key={i}
            className={`hex-layer${isTop ? ' hex-layer--top' : ''}`}
            style={{
              backgroundColor: isTop ? COLOR_MAP[color] : DARK_MAP[color],
              bottom: `${offset}px`,
              zIndex: i,
              boxShadow: isTop
                ? `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`
                : `0 1px 2px rgba(0,0,0,0.2)`,
            }}
          />
        )
      })}
    </div>
  )
})

export default HexCell
