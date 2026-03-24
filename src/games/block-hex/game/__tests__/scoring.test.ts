import { describe, it, expect } from 'vitest'
import { calculateMatchScore } from '../scoring'

describe('calculateMatchScore', () => {
  it('returns 10 × layersCleared × 1 for chainStep 0', () => {
    expect(calculateMatchScore(1, 0)).toBe(10)
    expect(calculateMatchScore(3, 0)).toBe(30)
  })

  it('multiplies by chainStep + 1', () => {
    // 10 × 2 × (1 + 1) = 40
    expect(calculateMatchScore(2, 1)).toBe(40)
  })

  it('increases with chain depth', () => {
    // chain step 0: 10 × 4 × 1 = 40
    // chain step 2: 10 × 4 × 3 = 120
    expect(calculateMatchScore(4, 0)).toBe(40)
    expect(calculateMatchScore(4, 2)).toBe(120)
  })

  it('returns 0 when no layers cleared', () => {
    expect(calculateMatchScore(0, 0)).toBe(0)
    expect(calculateMatchScore(0, 5)).toBe(0)
  })

  it('score grows proportionally with layers cleared', () => {
    const score1 = calculateMatchScore(1, 0)
    const score3 = calculateMatchScore(3, 0)
    expect(score3).toBe(score1 * 3)
  })

  it('score grows proportionally with chain multiplier', () => {
    const scoreChain0 = calculateMatchScore(2, 0)
    const scoreChain3 = calculateMatchScore(2, 3)
    // (3+1) / (0+1) = 4
    expect(scoreChain3).toBe(scoreChain0 * 4)
  })
})
