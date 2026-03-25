import { useEffect, useRef } from 'react'
import type { GameState } from '../game/types'
import {
  initAudio,
  playGameOver,
  playModeSwitch,
  playClear,
  playMiss,
  playStreak,
  playClaireSpeak,
} from '../audio/sounds'

export function useAudio(state: GameState): void {
  const prevGameOver = useRef(state.gameOver)
  const prevMode = useRef(state.mode)
  const prevLastAction = useRef(state.lastAction)
  const prevStreak = useRef(state.streak)
  const prevClaireMessage = useRef(state.claireMessage)

  // Initialise AudioContext on first user interaction
  useEffect(() => {
    const handler = () => {
      initAudio()
      window.removeEventListener('pointerdown', handler)
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])

  // Game over
  useEffect(() => {
    if (state.gameOver && !prevGameOver.current) {
      playGameOver()
    }
    prevGameOver.current = state.gameOver
  }, [state.gameOver])

  // Mode switch (whoosh)
  useEffect(() => {
    if (state.mode !== prevMode.current) {
      playModeSwitch()
    }
    prevMode.current = state.mode
  }, [state.mode])

  // Good move / bad move / streak — keyed on lastAction changes
  useEffect(() => {
    if (state.lastAction === prevLastAction.current) return
    prevLastAction.current = state.lastAction

    switch (state.lastAction) {
      case 'good_move': {
        const groupSize = 3 // minimum; actual size not stored on state, use default
        playClear(groupSize)
        break
      }
      case 'bad_move':
        playMiss()
        break
      default:
        break
    }
  }, [state.lastAction])

  // Streak chime — fires when streak increases past threshold
  useEffect(() => {
    if (state.streak > prevStreak.current && state.streak >= 3) {
      playStreak(state.streak)
    }
    prevStreak.current = state.streak
  }, [state.streak])

  // Claire speaking — subtle boop when a new message appears
  useEffect(() => {
    if (state.claireMessage !== null && state.claireMessage !== prevClaireMessage.current) {
      playClaireSpeak()
    }
    prevClaireMessage.current = state.claireMessage
  }, [state.claireMessage])
}
