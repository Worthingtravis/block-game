export { initAudio, setSoundEnabled, setMasterVolume, playGameOver } from '../../../audio/core'
import { playTone } from '../../../audio/core'

// Whoosh: descending then ascending sweep
export function playModeSwitch(): void {
  playTone(600, 0.12, 'sine', 0.25)
  playTone(300, 0.12, 'sine', 0.2, 0.1)
  playTone(500, 0.18, 'sine', 0.25, 0.22)
  playTone(700, 0.15, 'sine', 0.2, 0.36)
}

// Satisfying pop — pitch scales with group size
export function playClear(groupSize: number): void {
  const base = 400 + groupSize * 40
  playTone(base, 0.12, 'sine', 0.3)
  playTone(base * 1.25, 0.1, 'sine', 0.2, 0.06)
  if (groupSize >= 5) {
    playTone(base * 1.5, 0.1, 'sine', 0.2, 0.12)
  }
}

// Low dull thud
export function playMiss(): void {
  playTone(120, 0.2, 'triangle', 0.25)
  playTone(90, 0.15, 'sawtooth', 0.15, 0.05)
}

// Ascending chime — higher levels go higher
export function playStreak(level: number): void {
  const base = 500 + level * 50
  playTone(base, 0.15, 'sine', 0.25)
  playTone(base * 1.2, 0.15, 'sine', 0.25, 0.1)
  playTone(base * 1.5, 0.2, 'sine', 0.3, 0.2)
  if (level >= 3) {
    playTone(base * 2, 0.2, 'sine', 0.25, 0.3)
  }
}

// Subtle "boop" notification tone
export function playClaireSpeak(): void {
  playTone(880, 0.08, 'sine', 0.15)
  playTone(1100, 0.08, 'sine', 0.12, 0.07)
}

// Musical note for Simon Says (Pattern Echo)
// Maps index to a pentatonic scale starting at C4
const ECHO_NOTES_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]

export function playEchoNote(index: number): void {
  const freq = ECHO_NOTES_HZ[index % ECHO_NOTES_HZ.length]
  playTone(freq, 0.3, 'sine', 0.3)
}
