import { memo } from 'react'
import type { HexColor } from '../game/types'

const COLOR_MAP: Record<HexColor, string> = {
  blue: '#4a90d9',
  red: '#f44336',
  yellow: '#ffdd44',
  green: '#4caf50',
  purple: '#9c27b0',
}

type HexCellProps = {
  index: number
  stack: HexColor[]
  isMatching: boolean
  onClick: (index: number) => void
}

const HexCell = memo(function HexCell({ index, stack, isMatching, onClick }: HexCellProps) {
  const topColor = stack.length > 0 ? stack[stack.length - 1] : null
  const isEmpty = topColor === null

  const style = topColor
    ? { backgroundColor: COLOR_MAP[topColor] }
    : undefined

  return (
    <div
      className={[
        'hex-cell',
        isEmpty ? 'hex-cell--empty' : '',
        isMatching ? 'hex-cell--matching' : '',
      ].filter(Boolean).join(' ')}
      style={style}
      onClick={() => onClick(index)}
      aria-label={`Cell ${index}${topColor ? `, ${topColor}` : ', empty'}${stack.length > 1 ? `, depth ${stack.length}` : ''}`}
    >
      {stack.length > 1 && (
        <span className="hex-cell__depth">{stack.length}</span>
      )}
    </div>
  )
})

export default HexCell
