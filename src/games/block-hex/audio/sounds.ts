export { initAudio, setSoundEnabled, setMasterVolume, playGameOver } from '../../../audio/core'
import { playTone } from '../../../audio/core'

export function playPlace(): void {
  playTone(250, 0.1, 'sine', 0.25)
}

export function playMatch(chainStep: number): void {
  const baseFreq = 350 + chainStep * 80
  playTone(baseFreq, 0.2, 'sine', 0.3)
  playTone(baseFreq * 1.5, 0.15, 'sine', 0.2, 0.05)
}

export function playChain(chainStep: number): void {
  for (let i = 0; i <= Math.min(chainStep, 4); i++) {
    playTone(400 + i * 120, 0.2, 'sine', 0.3, i * 0.08)
  }
}
