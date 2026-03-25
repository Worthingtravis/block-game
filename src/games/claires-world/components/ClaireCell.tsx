import { memo } from 'react'
import { motion } from 'motion/react'
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
    <motion.div
      className={className}
      style={bg ? { backgroundColor: bg } : undefined}
      onTap={() => onCellClick(row, col)}
      whileHover={!obstacle && !!color ? { scale: 1.08, zIndex: 2 } : undefined}
      whileTap={!obstacle && !!color ? { scale: 0.92 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      aria-label={
        obstacle
          ? 'obstacle'
          : color
          ? `${color} cell`
          : 'empty cell'
      }
    />
  )
})

export default ClaireCell
