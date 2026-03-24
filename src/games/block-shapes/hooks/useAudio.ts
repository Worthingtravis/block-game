import { useEffect, useState } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playLineClear, playCombo, playGameOver } from '../audio/sounds'
import { vibrateClear, vibrateGameOver } from '../audio/haptics'

export function useAudio(state: GameState) {
  const [prevGameOver, setPrevGameOver] = useState(state.gameOver)

  if (state.gameOver !== prevGameOver) {
    if (state.gameOver && !prevGameOver) {
      playGameOver()
      vibrateGameOver()
    }
    setPrevGameOver(state.gameOver)
  }

  useEffect(() => {
    if (!state.lastClear || state.lastClear.linesCleared === 0) return
    playLineClear(state.lastClear.linesCleared)
    vibrateClear()
    if (state.lastClear.linesCleared >= 2) {
      playCombo(state.lastClear.linesCleared)
    }
  }, [state.lastClear])

  useEffect(() => {
    const handler = () => {
      initAudio()
      window.removeEventListener('pointerdown', handler)
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])
}
