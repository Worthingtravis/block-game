export function calculatePlacementScore(blockCount: number): number {
  return blockCount
}

export function calculateClearScore(linesCleared: number, comboMultiplier: number): number {
  if (linesCleared === 0) return 0
  return 10 * linesCleared * linesCleared * comboMultiplier
}

export function updateCombo(linesCleared: number, currentCombo: number): number {
  return linesCleared >= 1 ? currentCombo + 1 : 1
}
