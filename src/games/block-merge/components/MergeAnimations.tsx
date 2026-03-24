import { useState, useEffect } from 'react'
import type { MergeResult } from '../game/types'
import { VALUE_COLORS, BOARD_SIZE } from '../game/types'
import type { MergeValue } from '../game/types'
import type { AnimationPhase } from '../hooks/useMergeAnimation'
import { CHAIN_STEP_DELAY } from '../hooks/useMergeAnimation'

type AnimatingCell = {
  id: number
  fromRow: number
  fromCol: number
  toRow: number
  toCol: number
  value: MergeValue
  delay: number
}

let nextAnimId = 0

type MergeAnimationsProps = {
  lastMerges: MergeResult[] | null
  phase: AnimationPhase
}

export default function MergeAnimations({ lastMerges, phase }: MergeAnimationsProps) {
  const [cells, setCells] = useState<AnimatingCell[]>([])
  const [prevMerges, setPrevMerges] = useState<MergeResult[] | null>(null)

  if (lastMerges !== prevMerges) {
    setPrevMerges(lastMerges)
    if (lastMerges && lastMerges.length > 0) {
      const newCells: AnimatingCell[] = []
      for (const merge of lastMerges) {
        // Chain steps stagger relative to each other
        const delay = merge.chainDepth * CHAIN_STEP_DELAY
        for (const cell of merge.mergedCells) {
          newCells.push({
            id: nextAnimId++,
            fromRow: cell.row,
            fromCol: cell.col,
            toRow: merge.resultCell.row,
            toCol: merge.resultCell.col,
            value: merge.sourceValue,
            delay,
          })
        }
      }
      setCells(newCells)
    }
  }

  // Clear after all animations finish
  useEffect(() => {
    if (cells.length === 0) return
    const maxDelay = Math.max(...cells.map(c => c.delay))
    const timer = setTimeout(() => setCells([]), maxDelay + 500)
    return () => clearTimeout(timer)
  }, [cells])

  // Only render ghost cells during the sliding phase
  if (cells.length === 0 || phase !== 'sliding') return null

  return (
    <div className="merge-anim-layer">
      {cells.map(cell => {
        const cellPct = 100 / BOARD_SIZE
        const fromLeft = cell.fromCol * cellPct + cellPct / 2
        const fromTop = cell.fromRow * cellPct + cellPct / 2
        const dxPct = (cell.toCol - cell.fromCol) * cellPct
        const dyPct = (cell.toRow - cell.fromRow) * cellPct

        return (
          <div
            key={cell.id}
            className="merge-anim-cell"
            style={{
              left: `${fromLeft}%`,
              top: `${fromTop}%`,
              backgroundColor: VALUE_COLORS[cell.value],
              '--dx': `${dxPct}cqi`,
              '--dy': `${dyPct}cqi`,
              animationDelay: `${cell.delay}ms`,
            } as React.CSSProperties}
          >
            {cell.value}
          </div>
        )
      })}
    </div>
  )
}
