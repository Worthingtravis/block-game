import type { MergeResult } from './types'

/**
 * Points for a single merge: value × groupSize × 2^(groupSize - 2).
 * Two blocks = base, three = 2×, four = 4×, five = 8×.
 */
export function calculateMergePoints(sourceValue: number, groupSize: number): number {
  const multiBonus = Math.pow(2, Math.max(0, groupSize - 2))
  return sourceValue * groupSize * multiBonus
}

/**
 * Chain bonus multiplier: each successive merge in a cascade gets +1×.
 * Step 0 = 1×, step 1 = 2×, step 2 = 3×, etc.
 */
export function calculateChainBonus(chainStep: number): number {
  return chainStep + 1
}

/**
 * Total score for a sequence of merges (a full cascade).
 * Each merge's points are multiplied by its chain bonus.
 */
export function calculateTotalScore(merges: MergeResult[]): number {
  let total = 0
  for (let i = 0; i < merges.length; i++) {
    const merge = merges[i]
    const groupSize = merge.mergedCells.length + 1
    const points = calculateMergePoints(merge.sourceValue, groupSize)
    const bonus = calculateChainBonus(i)
    total += points * bonus
  }
  return total
}
