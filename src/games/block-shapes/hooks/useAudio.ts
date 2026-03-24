import { useEffect, useState } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playLineClear, playCombo, playGameOver, playBombEarned } from '../audio/sounds'
import { vibrateClear, vibrateGameOver } from '../audio/haptics'

export function useAudio(state: GameState) {
  const [prevGameOver, setPrevGameOver] = useState(state.gameOver)
  const [prevCombo, setPrevCombo] = useState(state.comboMultiplier)
  const [prevBombs, setPrevBombs] = useState(state.bombs)

  if (state.gameOver !== prevGameOver) {
    if (state.gameOver && !prevGameOver) {
      playGameOver()
      vibrateGameOver()
    }
    setPrevGameOver(state.gameOver)
  }

  if (state.comboMultiplier !== prevCombo) {
    if (state.comboMultiplier > prevCombo && state.comboMultiplier >= 2) {
      playCombo(state.comboMultiplier)
    }
    setPrevCombo(state.comboMultiplier)
  }

  if (state.bombs !== prevBombs) {
    if (state.bombs > prevBombs) {
      playBombEarned()
    }
    setPrevBombs(state.bombs)
  }

  useEffect(() => {
    if (!state.lastClear || state.lastClear.linesCleared === 0) return
    playLineClear(state.lastClear.linesCleared)
    vibrateClear()
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
