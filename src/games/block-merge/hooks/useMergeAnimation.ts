import { useState, useEffect, useRef } from 'react'
import type { Board, MergeResult, DropInfo } from '../game/types'

/**
 * Animation timing constants (ms).
 * DROP_DURATION: time for the block drop + bounce to finish.
 * SETTLE_PAUSE: brief pause after drop so the player sees the block land.
 * SLIDE_DURATION: time for consumed cells to slide toward the result.
 * CHAIN_STEP_DELAY: additional delay between chain reaction steps.
 */
const DROP_DURATION = 280
const SETTLE_PAUSE = 80
const SLIDE_DURATION = 300
const CHAIN_STEP_DELAY = 350

export type AnimationPhase = 'idle' | 'dropping' | 'sliding' | 'popping'

type MergeAnimationState = {
  /** The board to render visually (pre-merge during slide, final after pop). */
  displayBoard: Board
  /** Current animation phase. */
  phase: AnimationPhase
  /** Whether the drop animation is active on the dropped cell. */
  dropping: boolean
  /** Set of "row,col" keys for cells that should show the merge pop. */
  poppingSet: Set<string>
  /** The chain depth currently animating (for staggered effects). */
  activeChainDepth: number
}

/**
 * Orchestrates the phased merge animation sequence:
 *   1. Drop phase: block falls with bounce, board shows pre-merge state
 *   2. Slide phase: ghost cells slide toward merge target, board still pre-merge
 *   3. Pop phase: board switches to final state, result cells pop in
 *
 * Returns the display board and phase info so the board, animations,
 * particles, and audio can all key off the same timeline.
 */
export function useMergeAnimation(
  board: Board,
  preBoard: Board | null,
  lastMerges: MergeResult[] | null,
  lastDrop: DropInfo | null,
): MergeAnimationState {
  const [phase, setPhase] = useState<AnimationPhase>('idle')
  const [displayBoard, setDisplayBoard] = useState<Board>(board)
  const [dropping, setDropping] = useState(false)
  const [poppingSet, setPoppingSet] = useState<Set<string>>(new Set())
  const [activeChainDepth, setActiveChainDepth] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const prevMergesRef = useRef<MergeResult[] | null>(null)

  useEffect(() => {
    // Only trigger when lastMerges identity changes
    if (lastMerges === prevMergesRef.current) return
    prevMergesRef.current = lastMerges

    // Clear any pending timers from a previous animation
    for (const t of timersRef.current) clearTimeout(t)
    timersRef.current = []

    const hasMerges = lastMerges && lastMerges.length > 0

    if (!hasMerges) {
      // No merge -- just a simple drop
      setDisplayBoard(board)
      setPoppingSet(new Set())
      setActiveChainDepth(0)

      if (lastDrop) {
        setPhase('dropping')
        setDropping(true)
        const t = setTimeout(() => {
          setDropping(false)
          setPhase('idle')
        }, DROP_DURATION)
        timersRef.current.push(t)
      } else {
        setPhase('idle')
        setDropping(false)
      }
      return
    }

    // --- Merge animation sequence ---

    // Phase 1: Drop -- show preBoard with drop animation
    setDisplayBoard(preBoard ?? board)
    setPhase('dropping')
    setDropping(true)
    setPoppingSet(new Set())
    setActiveChainDepth(0)

    const maxChainDepth = Math.max(...lastMerges.map(m => m.chainDepth))

    // After drop completes + settle pause, begin slide phase
    const slideStart = DROP_DURATION + SETTLE_PAUSE

    const t1 = setTimeout(() => {
      setDropping(false)
      setPhase('sliding')
    }, slideStart)
    timersRef.current.push(t1)

    // For each chain depth, schedule the pop transition
    for (let depth = 0; depth <= maxChainDepth; depth++) {
      const chainOffset = depth * CHAIN_STEP_DELAY
      const popTime = slideStart + SLIDE_DURATION + chainOffset

      const t = setTimeout(() => {
        setActiveChainDepth(depth)
        setPhase('popping')

        // Build popping set for this chain depth's result cells
        const newPoppingSet = new Set<string>()
        for (const merge of lastMerges) {
          if (merge.chainDepth <= depth) {
            newPoppingSet.add(`${merge.resultCell.row},${merge.resultCell.col}`)
          }
        }
        setPoppingSet(newPoppingSet)

        // Switch to the final board once all chain steps have popped
        if (depth === maxChainDepth) {
          setDisplayBoard(board)
        }
      }, popTime)
      timersRef.current.push(t)
    }

    // Return to idle after all animations complete
    const totalDuration = slideStart + SLIDE_DURATION + maxChainDepth * CHAIN_STEP_DELAY + 400
    const tIdle = setTimeout(() => {
      setPhase('idle')
      setPoppingSet(new Set())
      setDisplayBoard(board)
    }, totalDuration)
    timersRef.current.push(tIdle)

    return () => {
      for (const t of timersRef.current) clearTimeout(t)
      timersRef.current = []
    }
  }, [lastMerges, lastDrop, board, preBoard])

  return { displayBoard, phase, dropping, poppingSet, activeChainDepth }
}

/** Returns the total delay (ms) before a given chain depth's slide begins. */
export function getChainStepDelay(chainDepth: number): number {
  return DROP_DURATION + SETTLE_PAUSE + chainDepth * CHAIN_STEP_DELAY
}

/** Slide duration constant exported for CSS animation-delay calculations. */
export { SLIDE_DURATION, CHAIN_STEP_DELAY, DROP_DURATION, SETTLE_PAUSE }
