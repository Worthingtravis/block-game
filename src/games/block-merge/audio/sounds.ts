export { initAudio, setSoundEnabled, setMasterVolume, playGameOver } from '../../../audio/core'
import { playTone } from '../../../audio/core'

export function playPlace(): void {
  playTone(300, 0.08, 'sine', 0.25)
}

export function playMerge(resultValue: number): void {
  const baseFreq = 300 + Math.log2(resultValue) * 50
  playTone(baseFreq, 0.2, 'sine', 0.35)
  playTone(baseFreq * 1.5, 0.15, 'sine', 0.2, 0.05)
}

export function playChainReaction(chainDepth: number): void {
  for (let i = 0; i <= chainDepth; i++) {
    playTone(400 + i * 150, 0.25, 'sine', 0.3, i * 0.1)
  }
}
