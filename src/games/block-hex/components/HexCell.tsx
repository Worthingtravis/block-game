import { memo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { HexCellVM } from '../block-hex.vm'
import { HEX_COLORS } from '../block-hex.vm'

const MAX_VISIBLE_LAYERS = 5
const LAYER_OFFSET = 4

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

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
        <motion.div
          className="hex-cell hex-cell--empty"
          onClick={() => onClick(cell.index)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={springTransition}
        />
      ) : (
        <motion.div
          className="hex-cell hex-cell--filled"
          onClick={() => onClick(cell.index)}
          whileHover={{ scale: 1.06, y: -3 }}
          whileTap={{ scale: 0.97 }}
          animate={cell.isMatching ? {
            scale: [1, 1.2, 0.9, 1.05, 1],
            filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)', 'brightness(1.1)', 'brightness(1)'],
          } : { scale: 1, filter: 'brightness(1)' }}
          transition={cell.isMatching ? { duration: 0.5, ease: 'easeOut' } : springTransition}
        >
          <AnimatePresence>
            {cell.stack.slice(-MAX_VISIBLE_LAYERS).map((color, i, arr) => {
              const isTop = i === arr.length - 1
              const depth = (arr.length - 1 - i) * LAYER_OFFSET
              const colors = HEX_COLORS[color]
              return (
                <motion.div
                  key={`${cell.index}-${i}`}
                  className={`hex-disc${isTop ? ' hex-disc--top' : ''}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, delay: i * 0.03 }}
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
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
})

export default HexCell
