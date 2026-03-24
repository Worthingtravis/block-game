import { useEffect, useState } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playMatch, playChain, playPlace, playGameOver } from '../audio/sounds'

export function useAudio(state: GameState): void {
  const [prevPhase, setPrevPhase] = useState(state.phase)
  const [prevGameOver, setPrevGameOver] = useState(state.gameOver)

  if (state.phase !== prevPhase) {
    setPrevPhase(state.phase)
    if (state.phase === 'placing') playPlace()
    if (state.phase === 'matching' && state.lastMatch) playMatch(state.chainStep)
    if (state.phase === 'chain' && state.lastMatch) playChain(state.chainStep)
  }

  if (state.gameOver !== prevGameOver) {
    if (state.gameOver && !prevGameOver) playGameOver()
    setPrevGameOver(state.gameOver)
  }

  useEffect(() => {
    const handler = () => { initAudio(); window.removeEventListener('pointerdown', handler) }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])
}
