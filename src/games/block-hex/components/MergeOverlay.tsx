import { motion, AnimatePresence } from 'motion/react'
import type { HexCellVM } from '../block-hex.vm'
import { HEX_COLORS } from '../block-hex.vm'
import type { MatchResult, Phase } from '../game/types'

type MergeOverlayProps = {
  cells: HexCellVM[]
  lastMatch: MatchResult | null
  phase: Phase
}

/**
 * Renders flying hex discs that animate from matched cells toward their
 * centroid during the matching/chain phase. Creates the visual effect
 * of pieces being "pulled together" before disappearing.
 */
export default function MergeOverlay({ cells, lastMatch, phase }: MergeOverlayProps) {
  const isActive = (phase === 'matching' || phase === 'chain') && lastMatch && lastMatch.cellIndices.length > 0

  if (!isActive || !lastMatch) return null

  // Find the centroid of matched cells
  const matchedCells = lastMatch.cellIndices
    .map(idx => cells.find(c => c.index === idx))
    .filter(Boolean) as HexCellVM[]

  if (matchedCells.length === 0) return null

  const centroidX = matchedCells.reduce((sum, c) => sum + c.x, 0) / matchedCells.length
  const centroidY = matchedCells.reduce((sum, c) => sum + c.y, 0) / matchedCells.length

  const colors = HEX_COLORS[lastMatch.color]

  return (
    <div className="merge-overlay">
      <AnimatePresence>
        {matchedCells.map(cell => {
          // Calculate direction from this cell toward the centroid
          const dx = centroidX - cell.x
          const dy = centroidY - cell.y

          return (
            <motion.div
              key={`merge-${cell.index}-${lastMatch.chainDepth}`}
              className="merge-fly-disc"
              style={{
                left: `calc(${cell.x} * var(--hex-w) + var(--hex-w) / 2)`,
                top: `calc(${cell.y} * var(--hex-row-h) + var(--hex-h) / 2)`,
                backgroundColor: colors.face,
              }}
              initial={{ scale: 1, opacity: 0.9, x: 0, y: 0 }}
              animate={{
                x: `calc(${dx} * var(--hex-w) * 0.5)`,
                y: `calc(${dy} * var(--hex-row-h) * 0.5)`,
                scale: 0,
                opacity: 0,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          )
        })}
      </AnimatePresence>

      {/* Glow burst at centroid */}
      <motion.div
        key={`glow-${lastMatch.chainDepth}`}
        className="merge-glow"
        style={{
          left: `calc(${centroidX} * var(--hex-w) + var(--hex-w) / 2)`,
          top: `calc(${centroidY} * var(--hex-row-h) + var(--hex-h) / 2)`,
          backgroundColor: colors.glow,
        }}
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  )
}
