import { useEffect, useState, useRef } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playMerge, playChainReaction, playGameOver, playDrop, playNewTileUnlocked } from '../audio/sounds'
import { getChainStepDelay, SLIDE_DURATION } from './useMergeAnimation'

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

    if (state.lastMerges && state.lastMerges.length > 0) {
      // Stagger merge sounds so they align with the visual chain steps.
      // Each chain step's audio fires when its slide finishes (at pop time).
      for (const merge of state.lastMerges) {
        const delay = getChainStepDelay(merge.chainDepth) + SLIDE_DURATION
        const t = setTimeout(() => {
          playMerge(merge.resultValue, merge.mergedCells.length + 1)
          if (merge.chainDepth > 0) playChainReaction(merge.chainDepth)
        }, delay)
        timersRef.current.push(t)
      }
    } else if (!state.gameOver) {
      playDrop()
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
