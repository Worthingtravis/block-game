import type { MergeResult } from './types'

export function calculateMergeScore(merge: MergeResult): number {
  return merge.resultValue
}
