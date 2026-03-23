import { describe, it, expect } from 'vitest'
import { calculatePlacementScore, calculateClearScore, updateCombo } from '../scoring'
import type { ClearResult } from '../types'

function makeClear(rows: number[], cols: number[]): ClearResult {
  const clearedCells = []
  for (const r of rows) for (let c = 0; c < 8; c++) clearedCells.push({ row: r, col: c })
  for (const c of cols) for (let r = 0; r < 8; r++) clearedCells.push({ row: r, col: c })
  return { clearedRows: rows, clearedCols: cols, clearedCells, linesCleared: rows.length + cols.length }
}

describe('calculatePlacementScore', () => {
  it('returns 1 point per block', () => {
    expect(calculatePlacementScore(1)).toBe(1)
    expect(calculatePlacementScore(5)).toBe(5)
    expect(calculatePlacementScore(9)).toBe(9)
  })
})

describe('calculateClearScore', () => {
  it('returns 0 for no clears', () => {
    expect(calculateClearScore(makeClear([], []), 1)).toBe(0)
  })

  it('returns 10 for 1 row at combo 1', () => {
    expect(calculateClearScore(makeClear([0], []), 1)).toBe(10)
  })

  it('returns 40 for 2 rows at combo 1', () => {
    expect(calculateClearScore(makeClear([0, 1], []), 1)).toBe(40)
  })

  it('gives cross bonus for 1 row + 1 col at combo 1', () => {
    // 2 lines = 10*4 = 40 base + 20 cross = 60
    expect(calculateClearScore(makeClear([0], [0]), 1)).toBe(60)
  })

  it('gives cross bonus for 2 rows + 2 cols at combo 1', () => {
    // 4 lines = 10*16 = 160 + 20*4 crosses = 240
    expect(calculateClearScore(makeClear([0, 1], [0, 1]), 1)).toBe(240)
  })

  it('applies combo multiplier', () => {
    // 1 row at combo 3 = 10 * 3 = 30
    expect(calculateClearScore(makeClear([0], []), 3)).toBe(30)
  })

  it('applies combo to cross bonus too', () => {
    // (40 base + 20 cross) * 2 = 120
    expect(calculateClearScore(makeClear([0], [0]), 2)).toBe(120)
  })
})

describe('updateCombo', () => {
  it('adds lines cleared to current combo', () => {
    expect(updateCombo(1, 1)).toBe(2)
    expect(updateCombo(2, 1)).toBe(3)
    expect(updateCombo(1, 3)).toBe(4)
    expect(updateCombo(3, 2)).toBe(5)
  })
  it('decrements by 1 when no lines cleared', () => {
    expect(updateCombo(0, 5)).toBe(4)
    expect(updateCombo(0, 3)).toBe(2)
    expect(updateCombo(0, 2)).toBe(1)
  })
  it('floors at 1', () => {
    expect(updateCombo(0, 1)).toBe(1)
  })
})
