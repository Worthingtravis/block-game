import { describe, it, expect } from 'vitest'
import { calculateMergePoints, calculateChainBonus, calculateTotalScore } from '../scoring'
import type { MergeResult } from '../types'

// Helper to build a MergeResult
function merge(sourceValue: number, groupSize: number, resultValue?: number): MergeResult {
  const rv = resultValue ?? sourceValue * Math.pow(2, Math.max(groupSize - 1, 1))
  return {
    mergedCells: Array.from({ length: groupSize - 1 }, (_, i) => ({ row: 0, col: i + 1 })),
    resultCell: { row: 0, col: 0 },
    sourceValue,
    resultValue: rv,
  }
}

describe('calculateMergePoints', () => {
  it('two blocks: base score with no multi bonus', () => {
    // Two 2s: 2 × 2 × 2^0 = 4
    expect(calculateMergePoints(2, 2)).toBe(4)
  })

  it('two larger blocks: scales with value', () => {
    // Two 16s: 16 × 2 × 2^0 = 32
    expect(calculateMergePoints(16, 2)).toBe(32)
    // Two 64s: 64 × 2 × 2^0 = 128
    expect(calculateMergePoints(64, 2)).toBe(128)
  })

  it('three blocks: 2× multi bonus', () => {
    // Three 2s: 2 × 3 × 2^1 = 12
    expect(calculateMergePoints(2, 3)).toBe(12)
    // Three 4s: 4 × 3 × 2^1 = 24
    expect(calculateMergePoints(4, 3)).toBe(24)
  })

  it('four blocks: 4× multi bonus', () => {
    // Four 2s: 2 × 4 × 2^2 = 32
    expect(calculateMergePoints(2, 4)).toBe(32)
  })

  it('five blocks: 8× multi bonus', () => {
    // Five 2s: 2 × 5 × 2^3 = 80
    expect(calculateMergePoints(2, 5)).toBe(80)
  })
})

describe('calculateChainBonus', () => {
  it('first merge in a chain: 1× multiplier', () => {
    expect(calculateChainBonus(0)).toBe(1)
  })

  it('second merge in chain: 2× multiplier', () => {
    expect(calculateChainBonus(1)).toBe(2)
  })

  it('third merge in chain: 3× multiplier', () => {
    expect(calculateChainBonus(2)).toBe(3)
  })

  it('fifth merge: 5× multiplier', () => {
    expect(calculateChainBonus(4)).toBe(5)
  })
})

describe('calculateTotalScore', () => {
  it('single merge with no chain', () => {
    const merges = [merge(2, 2)]
    // Points: 4, chain bonus: 1× → total: 4
    expect(calculateTotalScore(merges)).toBe(4)
  })

  it('two-step chain: second merge gets 2× bonus', () => {
    const merges = [merge(2, 2), merge(4, 2)]
    // Step 0: 2×2×1 × 1 = 4
    // Step 1: 4×2×1 × 2 = 16
    // Total: 20
    expect(calculateTotalScore(merges)).toBe(20)
  })

  it('three-step chain with escalating bonuses', () => {
    const merges = [merge(2, 2), merge(4, 2), merge(8, 2)]
    // Step 0: 4 × 1 = 4
    // Step 1: 8 × 2 = 16
    // Step 2: 16 × 3 = 48
    // Total: 68
    expect(calculateTotalScore(merges)).toBe(68)
  })

  it('multi-merge in a chain gets both bonuses', () => {
    const merges = [merge(2, 3), merge(8, 2)]
    // Step 0: 2×3×2 × 1 = 12
    // Step 1: 8×2×1 × 2 = 32
    // Total: 44
    expect(calculateTotalScore(merges)).toBe(44)
  })

  it('empty merge list returns 0', () => {
    expect(calculateTotalScore([])).toBe(0)
  })

  it('large chain with big values', () => {
    const merges = [merge(64, 2), merge(128, 2), merge(256, 3)]
    // Step 0: 64×2×1 × 1 = 128
    // Step 1: 128×2×1 × 2 = 512
    // Step 2: 256×3×2 × 3 = 4608
    // Total: 5248
    expect(calculateTotalScore(merges)).toBe(5248)
  })
})
