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

export function playPlace() {
  playTone(300, 0.08, 'sine', 0.25)
}

export function playMerge(resultValue: number) {
  const baseFreq = 300 + Math.log2(resultValue) * 50
  playTone(baseFreq, 0.2, 'sine', 0.35)
  playTone(baseFreq * 1.5, 0.15, 'sine', 0.2, 0.05)
}

export function playChainReaction(chainDepth: number) {
  for (let i = 0; i <= chainDepth; i++) {
    playTone(400 + i * 150, 0.25, 'sine', 0.3, i * 0.1)
  }
}

export function playGameOver() {
  playTone(400, 0.5, 'sine', 0.3)
  playTone(300, 0.5, 'sine', 0.3, 0.2)
  playTone(200, 0.8, 'sine', 0.3, 0.4)
}
