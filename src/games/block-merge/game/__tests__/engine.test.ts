import { describe, it, expect } from 'vitest'
import { createEmptyBoard, findMergeGroup, resolveChains, checkGameOver } from '../engine'
import { BOARD_SIZE } from '../types'
import type { Board } from '../types'

// Helper to fill a board cell-by-cell from a 2D array of values
function makeBoard(values: (number | null)[][]): Board {
  return values.map(row =>
    row.map(v => (v === null ? null : (v as Board[number][number])))
  )
}

describe('createEmptyBoard', () => {
  it('returns a 5x5 grid of nulls', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(BOARD_SIZE)
    board.forEach(row => {
      expect(row).toHaveLength(BOARD_SIZE)
      row.forEach(cell => expect(cell).toBeNull())
    })
  })
})

describe('findMergeGroup', () => {
  it('finds all orthogonally-adjacent same-value cells', () => {
    const board = createEmptyBoard()
    // Place three 2s in a row at (0,0), (0,1), (0,2)
    board[0][0] = 2
    board[0][1] = 2
    board[0][2] = 2

    const group = findMergeGroup(board, { row: 0, col: 0 })
    expect(group).toHaveLength(3)
    const keys = group.map(c => `${c.row},${c.col}`).sort()
    expect(keys).toEqual(['0,0', '0,1', '0,2'])
  })

  it('returns empty array for a single isolated cell', () => {
    const board = createEmptyBoard()
    board[2][2] = 4

    const group = findMergeGroup(board, { row: 2, col: 2 })
    expect(group).toHaveLength(0)
  })

  it('does not include diagonally-adjacent cells', () => {
    const board = createEmptyBoard()
    board[0][0] = 8
    board[1][1] = 8 // diagonal — should NOT be included

    const group = findMergeGroup(board, { row: 0, col: 0 })
    expect(group).toHaveLength(0)
  })

  it('stops at cells with a different value', () => {
    const board = createEmptyBoard()
    board[0][0] = 2
    board[0][1] = 2
    board[0][2] = 4 // different value — flood-fill should stop
    board[0][3] = 2

    const group = findMergeGroup(board, { row: 0, col: 0 })
    expect(group).toHaveLength(2)
  })
})

describe('resolveChains', () => {
  it('performs a basic merge: two 2s become one 4', () => {
    const board = createEmptyBoard()
    board[0][0] = 2
    board[0][1] = 2

    const { board: result, merges } = resolveChains(board, { row: 0, col: 0 })

    expect(merges).toHaveLength(1)
    expect(merges[0].resultValue).toBe(4)
    expect(merges[0].chainDepth).toBe(0)
    expect(result[0][0]).toBe(4)
    expect(result[0][1]).toBeNull()
  })

  it('handles chain reactions: 2+2→4 adjacent to another 4 becomes 8', () => {
    const board = createEmptyBoard()
    // origin at (0,1): two 2s at (0,0) and (0,1), pre-existing 4 at (0,2)
    // After first merge (0,0)+(0,1)→4 placed at origin (0,1), which is adjacent to (0,2)=4
    // Second merge fires: (0,1)=4 and (0,2)=4 → 8 at (0,1)
    board[0][0] = 2
    board[0][1] = 2
    board[0][2] = 4

    const { board: result, merges } = resolveChains(board, { row: 0, col: 1 })

    expect(merges).toHaveLength(2)
    expect(merges[0].resultValue).toBe(4)
    expect(merges[0].chainDepth).toBe(0)
    expect(merges[1].resultValue).toBe(8)
    expect(merges[1].chainDepth).toBe(1)
    expect(result[0][1]).toBe(8)
    expect(result[0][0]).toBeNull()
    expect(result[0][2]).toBeNull()
  })

  it('returns no merges when the group is a single cell', () => {
    const board = createEmptyBoard()
    board[1][1] = 16

    const { merges } = resolveChains(board, { row: 1, col: 1 })
    expect(merges).toHaveLength(0)
  })

  it('stops chain when value would exceed 1024', () => {
    const board = createEmptyBoard()
    // Two 512s merging would produce 1024 — that is the cap, so it should merge once
    board[0][0] = 512
    board[0][1] = 512

    const { board: result, merges } = resolveChains(board, { row: 0, col: 0 })
    expect(merges).toHaveLength(1)
    expect(merges[0].resultValue).toBe(1024)
    expect(result[0][0]).toBe(1024)
    expect(result[0][1]).toBeNull()
  })
})

describe('checkGameOver', () => {
  it('returns false for an empty board', () => {
    const board = createEmptyBoard()
    expect(checkGameOver(board)).toBe(false)
  })

  it('returns false when the board is full but adjacent cells share the same value', () => {
    // Fill entire 5x5 with 2s — every adjacent pair can merge
    const board = makeBoard(
      Array.from({ length: BOARD_SIZE }, () =>
        Array.from({ length: BOARD_SIZE }, () => 2)
      )
    )
    expect(checkGameOver(board)).toBe(false)
  })

  it('returns true when the board is full and no adjacent cells share a value', () => {
    // Checkerboard pattern: alternating 2 and 4 — no two adjacent cells match
    const board = makeBoard(
      Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => ((r + c) % 2 === 0 ? 2 : 4))
      )
    )
    expect(checkGameOver(board)).toBe(true)
  })

  it('returns false when one cell is empty even if no adjacent values match', () => {
    const board = makeBoard(
      Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => ((r + c) % 2 === 0 ? 2 : 4))
      )
    )
    // Leave one cell empty
    board[0][0] = null
    expect(checkGameOver(board)).toBe(false)
  })
})
