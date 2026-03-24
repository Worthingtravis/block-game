export { initAudio, setSoundEnabled, setMasterVolume, playGameOver } from '../../../audio/core'
import { playTone } from '../../../audio/core'

export function playDrop(): void {
  playTone(180, 0.08, 'sine', 0.2)
  playTone(120, 0.1, 'sine', 0.15, 0.04)
}

export function playMerge(resultValue: number, groupSize: number): void {
  const baseFreq = 250 + Math.log2(resultValue) * 60
  const volume = Math.min(0.2 + groupSize * 0.05, 0.4)
  // Main merge tone
  playTone(baseFreq, 0.25, 'sine', volume)
  // Harmonic shimmer
  playTone(baseFreq * 1.5, 0.15, 'sine', volume * 0.4, 0.03)
  // Higher values get a second harmonic
  if (resultValue >= 32) {
    playTone(baseFreq * 2, 0.1, 'sine', volume * 0.25, 0.06)
  }
}

export function playChainReaction(chainDepth: number): void {
  const baseFreq = 500 + chainDepth * 100
  for (let i = 0; i <= Math.min(chainDepth, 4); i++) {
    playTone(baseFreq + i * 80, 0.2, 'sine', 0.3, i * 0.08)
    playTone((baseFreq + i * 80) * 1.25, 0.12, 'sine', 0.15, i * 0.08 + 0.03)
  }
}

export function playNewTileUnlocked(): void {
  playTone(600, 0.15, 'sine', 0.3)
  playTone(750, 0.15, 'sine', 0.3, 0.1)
  playTone(900, 0.2, 'sine', 0.35, 0.2)
  playTone(1200, 0.25, 'sine', 0.25, 0.3)
}
