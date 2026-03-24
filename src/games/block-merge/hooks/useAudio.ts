import { useEffect, useState } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playMerge, playChainReaction, playGameOver, playDrop, playNewTileUnlocked } from '../audio/sounds'

export function useAudio(state: GameState): void {
  const [prevPhase, setPrevPhase] = useState(state.phase)
  const [prevGameOver, setPrevGameOver] = useState(state.gameOver)
  const [prevHighestTile, setPrevHighestTile] = useState(state.highestTile)
  const [mergeCount, setMergeCount] = useState(0)

  if (state.phase !== prevPhase) {
    setPrevPhase(state.phase)

    if (state.phase === 'dropping') {
      playDrop()
    }

    if (state.phase === 'merging' && state.currentMerge) {
      const newCount = mergeCount + 1
      setMergeCount(newCount)
      playMerge(state.currentMerge.resultValue, state.currentMerge.mergedCells.length + 1)
      if (newCount > 1) playChainReaction(newCount - 1)
    }

    if (state.phase === 'idle') {
      setMergeCount(0)
    }
  }

  if (state.gameOver !== prevGameOver) {
    if (state.gameOver && !prevGameOver) playGameOver()
    setPrevGameOver(state.gameOver)
  }

  if (state.highestTile !== prevHighestTile) {
    if (state.highestTile > prevHighestTile) playNewTileUnlocked()
    setPrevHighestTile(state.highestTile)
  }

  useEffect(() => {
    const handler = () => { initAudio(); window.removeEventListener('pointerdown', handler) }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])
}
