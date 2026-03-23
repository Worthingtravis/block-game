let vibrationEnabled = true

export function setVibrationEnabled(enabled: boolean): void {
  vibrationEnabled = enabled
}

function vibrate(pattern: number | number[]): void {
  if (!vibrationEnabled) return
  navigator.vibrate?.(pattern)
}

export function vibratePlace(): void {
  vibrate(15)
}

export function vibrateClear(): void {
  vibrate([20, 30, 20])
}

export function vibrateGameOver(): void {
  vibrate([50, 50, 100])
}
