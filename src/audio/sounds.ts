let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

export function initAudio(): void {
  getCtx()
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
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
    setTimeout(() => {
      playTone(400 + i * 200, 0.3, 'sine', 0.25)
    }, i * 80)
  }
}

export function playCombo(comboLevel: number) {
  playTone(300 + comboLevel * 100, 0.2, 'sine', 0.2)
}

export function playGameOver() {
  playTone(400, 0.5, 'sine', 0.3)
  setTimeout(() => playTone(300, 0.5, 'sine', 0.3), 200)
  setTimeout(() => playTone(200, 0.8, 'sine', 0.3), 400)
}
