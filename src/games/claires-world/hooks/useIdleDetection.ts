import { useEffect, useRef } from 'react'
import type { ModePhase, GameAction } from '../game/types'

const IDLE_THRESHOLD_MS = 8000

export function useIdleDetection(phase: ModePhase, dispatch: (a: GameAction) => void): void {
  const lastInteractionRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset last interaction on every TAP_CELL by wrapping dispatch isn't possible here,
  // so we expose a separate mechanism: callers must call reset() via an intercepted dispatch.
  // Instead, we observe phase changes as a proxy for activity. True interaction resets
  // happen via the touch listener on the window.
  useEffect(() => {
    const onInteract = () => {
      lastInteractionRef.current = Date.now()
    }

    window.addEventListener('pointerdown', onInteract)
    return () => window.removeEventListener('pointerdown', onInteract)
  }, [])

  useEffect(() => {
    if (phase !== 'active') {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const check = () => {
      const elapsed = Date.now() - lastInteractionRef.current
      if (elapsed >= IDLE_THRESHOLD_MS) {
        lastInteractionRef.current = Date.now()
        dispatch({ type: 'IDLE_TICK' })
      }
    }

    timerRef.current = setInterval(check, 1000)
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase, dispatch])
}
