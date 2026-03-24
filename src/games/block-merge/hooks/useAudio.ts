import { useEffect, useState, useRef } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playMerge, playChainReaction, playGameOver, playDrop, playNewTileUnlocked } from '../audio/sounds'
import { getChainStepDelay, SLIDE_DURATION, DROP_DURATION } from './useMergeAnimation'

export function useAudio(state: GameState): void {
  const [prevGameOver, setPrevGameOver] = useState(state.gameOver)
  const [prevBoard, setPrevBoard] = useState(state.board)
  const [prevHighestTile, setPrevHighestTile] = useState(state.highestTile)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  if (state.gameOver !== prevGameOver) {
    if (state.gameOver && !prevGameOver) playGameOver()
    setPrevGameOver(state.gameOver)
  }

  if (state.highestTile !== prevHighestTile) {
    if (state.highestTile > prevHighestTile) playNewTileUnlocked()
    setPrevHighestTile(state.highestTile)
  }

  if (state.board !== prevBoard) {
    setPrevBoard(state.board)

    // Clear pending audio timers from previous move
    for (const t of timersRef.current) clearTimeout(t)
    timersRef.current = []

    // Drop sound synced to landing moment
    if (!state.gameOver) {
      const dropT = setTimeout(() => playDrop(), DROP_DURATION * 0.7)
      timersRef.current.push(dropT)
    }

    if (state.lastMerges && state.lastMerges.length > 0) {
      // Merge sounds synced to each chain step's pop moment
      for (const merge of state.lastMerges) {
        const delay = getChainStepDelay(merge.chainDepth) + SLIDE_DURATION
        const t = setTimeout(() => {
          playMerge(merge.resultValue, merge.mergedCells.length + 1)
          if (merge.chainDepth > 0) playChainReaction(merge.chainDepth)
        }, delay)
        timersRef.current.push(t)
      }
    }
  }

  useEffect(() => {
    const handler = () => {
      initAudio()
      window.removeEventListener('pointerdown', handler)
    }
    window.addEventListener('pointerdown', handler)
    return () => {
      window.removeEventListener('pointerdown', handler)
      for (const t of timersRef.current) clearTimeout(t)
    }
  }, [])
}
