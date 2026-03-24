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

export function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  delay = 0,
): void {
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

export function playGameOver(): void {
  playTone(400, 0.5, 'sine', 0.3)
  playTone(300, 0.5, 'sine', 0.3, 0.2)
  playTone(200, 0.8, 'sine', 0.3, 0.4)
}

/**
 * Returns the AudioContext for advanced sound effects that need
 * direct access (e.g. noise buffers). Returns null when sound is disabled.
 */
export function getAudioContext(): { ctx: AudioContext; volume: number } | null {
  if (!soundEnabled) return null
  return { ctx: getCtx(), volume: masterVolume }
}
