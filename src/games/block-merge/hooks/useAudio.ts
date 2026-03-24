import { useEffect, useState } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playMerge, playChainReaction, playGameOver, playDrop, playNewTileUnlocked } from '../audio/sounds'

export function useAudio(state: GameState) {
  const [prevGameOver, setPrevGameOver] = useState(state.gameOver)
  const [prevBoard, setPrevBoard] = useState(state.board)
  const [prevHighestTile, setPrevHighestTile] = useState(state.highestTile)

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
    if (state.lastMerges && state.lastMerges.length > 0) {
      for (const merge of state.lastMerges) {
        playMerge(merge.resultValue, merge.mergedCells.length + 1)
        if (merge.chainDepth > 0) playChainReaction(merge.chainDepth)
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
    return () => window.removeEventListener('pointerdown', handler)
  }, [])
}
