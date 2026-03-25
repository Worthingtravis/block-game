import { memo } from 'react'
import type { ClaireCell as ClaireCellType } from '../game/types'
import { COLOR_VALUES } from '../game/types'

type Props = {
  cell: ClaireCellType
  row: number
  col: number
  onCellClick: (row: number, col: number) => void
}

const ClaireCell = memo(function ClaireCell({ cell, row, col, onCellClick }: Props) {
  const { color, obstacle, highlighted } = cell

  let className = 'claire-cell'
  if (obstacle) className += ' claire-cell--obstacle'
  else if (highlighted) className += ' claire-cell--highlighted'
  else if (!color) className += ' claire-cell--empty'

  const bg = obstacle ? undefined : color ? COLOR_VALUES[color] : undefined

  return (
    <div
      className={className}
      style={bg ? { backgroundColor: bg } : undefined}
      onClick={() => onCellClick(row, col)}
    />
  )
})

export default ClaireCell
