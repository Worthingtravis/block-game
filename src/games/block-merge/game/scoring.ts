import type { MergeResult } from './types'

/**
 * Sum of resultValue * (chainDepth + 1) for each merge.
 */
export function calculateMergeScore(merges: MergeResult[]): number {
  return merges.reduce((total, merge) => {
    return total + merge.resultValue * (merge.chainDepth + 1)
  }, 0)
}
