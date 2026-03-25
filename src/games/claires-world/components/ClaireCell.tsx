import { memo } from 'react'
import { motion } from 'motion/react'
import type { ClaireCell as ClaireCellType } from '../game/types'
import { COLOR_VALUES } from '../game/types'

type Props = {
  cell: ClaireCellType
  row: number
  col: number
  onCellClick: (row: number, col: number) => void
  entryDelay?: number
}

const ClaireCell = memo(function ClaireCell({ cell, row, col, onCellClick, entryDelay = 0 }: Props) {
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
      onClick={() => onCellClick(row, col)}
      initial={color ? { y: -(20 + row * 8), opacity: 0, scale: 0.7 } : false}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      whileHover={!obstacle && !!color ? { scale: 1.1, zIndex: 2 } : undefined}
      whileTap={!obstacle && !!color ? { scale: 0.9 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 20,
        delay: entryDelay,
      }}
    />
  )
})

export default ClaireCell
