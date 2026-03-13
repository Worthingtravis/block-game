import { useEffect, useRef } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playLineClear, playCombo, playGameOver } from '../audio/sounds'

export function useAudio(state: GameState) {
  const prevComboRef = useRef(state.comboMultiplier)
  const prevGameOverRef = useRef(state.gameOver)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      prevComboRef.current = state.comboMultiplier
      prevGameOverRef.current = state.gameOver
      return
    }

    if (state.gameOver && !prevGameOverRef.current) {
      playGameOver()
    }

    if (state.comboMultiplier > prevComboRef.current) {
      const linesGuess = state.comboMultiplier - prevComboRef.current
      playLineClear(linesGuess)
      if (state.comboMultiplier > 2) {
        playCombo(state.comboMultiplier)
      }
    }

    prevComboRef.current = state.comboMultiplier
    prevGameOverRef.current = state.gameOver
  }, [state.comboMultiplier, state.gameOver])

  useEffect(() => {
    const handler = () => {
      initAudio()
      window.removeEventListener('pointerdown', handler)
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])
}
