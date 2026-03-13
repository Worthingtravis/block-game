import { describe, it, expect } from 'vitest'
import { calculatePlacementScore, calculateClearScore, updateCombo } from '../scoring'

describe('calculatePlacementScore', () => {
  it('returns 1 point per block', () => {
    expect(calculatePlacementScore(1)).toBe(1)
    expect(calculatePlacementScore(5)).toBe(5)
    expect(calculatePlacementScore(9)).toBe(9)
  })
})

describe('calculateClearScore', () => {
  it('returns 0 for 0 lines cleared', () => {
    expect(calculateClearScore(0, 1)).toBe(0)
  })
  it('returns 10 for 1 line with combo 1', () => {
    expect(calculateClearScore(1, 1)).toBe(10)
  })
  it('returns 40 for 2 lines with combo 1', () => {
    expect(calculateClearScore(2, 1)).toBe(40)
  })
  it('applies combo multiplier: 2 lines, combo 3 = 120', () => {
    expect(calculateClearScore(2, 3)).toBe(120)
  })
})

describe('updateCombo', () => {
  it('increments combo when lines were cleared', () => {
    expect(updateCombo(1, 1)).toBe(2)
    expect(updateCombo(1, 3)).toBe(4)
  })
  it('resets combo to 1 when no lines cleared', () => {
    expect(updateCombo(0, 5)).toBe(1)
  })
})
