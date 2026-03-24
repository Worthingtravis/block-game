import { useState, useEffect, useRef } from 'react'
import type { MergeResult, DropInfo } from '../game/types'

/**
 * Animation timing constants (ms).
 */
export const DROP_DURATION = 250
export const SLIDE_DURATION = 300
export const CHAIN_STEP_DELAY = 350

export type AnimationPhase = 'idle' | 'dropping' | 'sliding'

/**
 * Simplified animation orchestrator.
 * The board always shows the final resolved state — animations are purely visual overlays.
 * This avoids the complexity and bugs of delaying the board state.
 */
export function useMergeAnimation(
  lastMerges: MergeResult[] | null,
  lastDrop: DropInfo | null,
) {
  const [phase, setPhase] = useState<AnimationPhase>('idle')
  const [dropping, setDropping] = useState(false)
  const [poppingSet, setPoppingSet] = useState<Set<string>>(new Set())
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const prevMergesRef = useRef<MergeResult[] | null>(null)
  const prevDropRef = useRef<DropInfo | null>(null)

  // Detect new moves
  const newMerges = lastMerges !== prevMergesRef.current
  const newDrop = lastDrop !== prevDropRef.current

  if (newMerges || newDrop) {
    prevMergesRef.current = lastMerges
    prevDropRef.current = lastDrop
  }

  useEffect(() => {
    if (!newMerges && !newDrop) return

    // Clear pending timers
    for (const t of timersRef.current) clearTimeout(t)
    timersRef.current = []

    const hasMerges = lastMerges && lastMerges.length > 0

    // Always start with drop animation if there's a drop
    if (lastDrop) {
      setDropping(true)
      setPhase('dropping')
      const t = setTimeout(() => {
        setDropping(false)
        if (hasMerges) {
          setPhase('sliding')
        } else {
          setPhase('idle')
        }
      }, DROP_DURATION)
      timersRef.current.push(t)
    }

    if (hasMerges) {
      const slideStart = lastDrop ? DROP_DURATION + 50 : 0

      // Start slide phase
      if (!lastDrop) {
        setPhase('sliding')
      }

      // Schedule pops per chain depth
      const maxChain = Math.max(...lastMerges.map(m => m.chainDepth))
      for (let depth = 0; depth <= maxChain; depth++) {
        const popTime = slideStart + SLIDE_DURATION + depth * CHAIN_STEP_DELAY
        const t = setTimeout(() => {
          const popping = new Set<string>()
          for (const merge of lastMerges) {
            if (merge.chainDepth === depth) {
              popping.add(`${merge.resultCell.row},${merge.resultCell.col}`)
            }
          }
          setPoppingSet(popping)
        }, popTime)
        timersRef.current.push(t)
      }

      // Clear popping and go idle
      const totalTime = slideStart + SLIDE_DURATION + maxChain * CHAIN_STEP_DELAY + 400
      const tIdle = setTimeout(() => {
        setPhase('idle')
        setPoppingSet(new Set())
      }, totalTime)
      timersRef.current.push(tIdle)
    }

    return () => {
      for (const t of timersRef.current) clearTimeout(t)
      timersRef.current = []
    }
  }, [lastMerges, lastDrop, newMerges, newDrop])

  return { phase, dropping, poppingSet }
}

/** Returns the total delay (ms) before a given chain depth's slide begins. */
export function getChainStepDelay(chainDepth: number): number {
  return DROP_DURATION + 50 + chainDepth * CHAIN_STEP_DELAY
}
