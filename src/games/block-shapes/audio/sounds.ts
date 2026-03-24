let audioCtx: AudioContext | null = null
let masterVolume = 0.7
let soundEnabled = true

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

export function initAudio(): void {
  getCtx()
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled
}

export function setMasterVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1, volume))
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, delay = 0) {
  if (!soundEnabled) return
  const ctx = getCtx()
  const scaledVolume = volume * masterVolume
  if (scaledVolume < 0.001) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  const t = ctx.currentTime + delay
  osc.frequency.setValueAtTime(frequency, t)
  gain.gain.setValueAtTime(scaledVolume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration)
}

export function playPickUp() {
  playTone(600, 0.1, 'sine', 0.2)
}

export function playPlace() {
  playTone(150, 0.15, 'sine', 0.4)
}

export function playInvalidDrop() {
  playTone(100, 0.1, 'sawtooth', 0.15)
}

export function playLineClear(linesCleared: number) {
  for (let i = 0; i < linesCleared; i++) {
    playTone(400 + i * 200, 0.3, 'sine', 0.25, i * 0.08)
  }
}

// Major chord intervals for triumphant feel
const CHORD_INTERVALS = [0, 4, 7, 12, 16, 19, 24]

export function playCombo(comboLevel: number) {
  const clamped = Math.min(comboLevel, 8)
  // Base note rises with combo: C4 → D4 → E4 → F#4 → ...
  const baseNote = 60 + (clamped - 2) * 2
  const baseFreq = 440 * Math.pow(2, (baseNote - 69) / 12)
  const volume = Math.min(0.12 + clamped * 0.03, 0.35)

  // More chord notes at higher combos
  const noteCount = Math.min(clamped, CHORD_INTERVALS.length)
  const spacing = Math.max(40, 80 - clamped * 5)

  for (let i = 0; i < noteCount; i++) {
    const semitones = CHORD_INTERVALS[i]
    const freq = baseFreq * Math.pow(2, semitones / 12)
    const dur = 0.2 + clamped * 0.06
    const delay = i * spacing / 1000
    playTone(freq, dur, 'sine', volume, delay)
    // Add shimmer harmonic at high combos
    if (clamped >= 4) {
      playTone(freq * 2, dur * 0.6, 'sine', volume * 0.3, delay)
    }
    // Add sub bass at very high combos
    if (clamped >= 6 && i === 0) {
      playTone(baseFreq / 2, dur * 1.5, 'triangle', volume * 0.4, delay)
    }
  }
}

export function playBombExplode() {
  playTone(80, 0.4, 'sawtooth', 0.35)
  playTone(60, 0.6, 'sawtooth', 0.25, 0.05)
  playTone(200, 0.2, 'sine', 0.2, 0.1)
}

export function playBombEarned() {
  playTone(500, 0.15, 'sine', 0.25)
  playTone(700, 0.15, 'sine', 0.25, 0.08)
  playTone(900, 0.2, 'sine', 0.3, 0.16)
}

export function playGameOver() {
  playTone(400, 0.5, 'sine', 0.3)
  playTone(300, 0.5, 'sine', 0.3, 0.2)
  playTone(200, 0.8, 'sine', 0.3, 0.4)
}
