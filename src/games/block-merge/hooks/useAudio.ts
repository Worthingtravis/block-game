import { useEffect, useState } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playMerge, playChainReaction, playGameOver, playPlace } from '../audio/sounds'

export function useAudio(state: GameState) {
  const [prevGameOver, setPrevGameOver] = useState(state.gameOver)
  const [prevBoard, setPrevBoard] = useState(state.board)

  if (state.gameOver !== prevGameOver) {
    if (state.gameOver && !prevGameOver) playGameOver()
    setPrevGameOver(state.gameOver)
  }

  if (state.board !== prevBoard) {
    setPrevBoard(state.board)
    if (state.lastMerges && state.lastMerges.length > 0) {
      for (const merge of state.lastMerges) {
        playMerge(merge.resultValue)
        if (merge.chainDepth > 0) playChainReaction(merge.chainDepth)
      }
    } else if (!state.gameOver) {
      playPlace()
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
