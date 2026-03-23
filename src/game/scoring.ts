import type { ClearResult } from './types'

export function calculatePlacementScore(blockCount: number): number {
  return blockCount
}

export function calculateClearScore(clear: ClearResult, combo: number): number {
  if (clear.linesCleared === 0) return 0

  const rows = clear.clearedRows.length
  const cols = clear.clearedCols.length
  const total = rows + cols

  let score = 10 * total * total

  // Cross bonus: row+col intersections
  if (rows > 0 && cols > 0) {
    score += 20 * rows * cols
  }

  return score * combo
}

export function updateCombo(linesCleared: number, currentCombo: number): number {
  if (linesCleared === 0) return Math.max(1, currentCombo - 1)
  return currentCombo + linesCleared
}
