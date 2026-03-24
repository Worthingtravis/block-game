import { describe, it, expect } from 'vitest'
import { createEmptyBoard, findMergeGroup, resolveChains, checkGameOver, applyGravity } from '../engine'
import { BOARD_SIZE } from '../types'
import type { Board } from '../types'

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
    board[4][0] = 2
    board[4][1] = 2
    board[4][2] = 2

    const group = findMergeGroup(board, { row: 4, col: 0 })
    expect(group).toHaveLength(3)
  })

  it('returns empty array for a single isolated cell', () => {
    const board = createEmptyBoard()
    board[4][2] = 4

    const group = findMergeGroup(board, { row: 4, col: 2 })
    expect(group).toHaveLength(0)
  })

  it('does not include diagonally-adjacent cells', () => {
    const board = createEmptyBoard()
    board[3][0] = 8
    board[4][1] = 8

    const group = findMergeGroup(board, { row: 3, col: 0 })
    expect(group).toHaveLength(0)
  })

  it('stops at cells with a different value', () => {
    const board = createEmptyBoard()
    board[4][0] = 2
    board[4][1] = 2
    board[4][2] = 4
    board[4][3] = 2

    const group = findMergeGroup(board, { row: 4, col: 0 })
    expect(group).toHaveLength(2)
  })
})

describe('applyGravity', () => {
  it('drops blocks to the bottom of their column', () => {
    const board = createEmptyBoard()
    board[0][0] = 2
    board[2][0] = 4

    const result = applyGravity(board)
    expect(result[0][0]).toBeNull()
    expect(result[2][0]).toBeNull()
    expect(result[3][0]).toBe(2)
    expect(result[4][0]).toBe(4)
  })
})

describe('resolveChains', () => {
  it('performs a basic merge: two 2s on bottom row become one 4', () => {
    const board = createEmptyBoard()
    board[4][0] = 2
    board[4][1] = 2

    const { board: result, merges } = resolveChains(board, { row: 4, col: 0 })

    expect(merges).toHaveLength(1)
    expect(merges[0].resultValue).toBe(4)
    expect(merges[0].chainDepth).toBe(0)
  })

  it('three same-value cells merge up two levels (e.g., 3x 2s → 8)', () => {
    const board = createEmptyBoard()
    board[4][0] = 2
    board[4][1] = 2
    board[4][2] = 2

    const { merges } = resolveChains(board, { row: 4, col: 1 })

    expect(merges).toHaveLength(1)
    expect(merges[0].resultValue).toBe(8) // 3 cells = +2 levels: 2 → 8
  })

  it('returns no merges when the group is a single cell', () => {
    const board = createEmptyBoard()
    board[4][1] = 16

    const { merges } = resolveChains(board, { row: 4, col: 1 })
    expect(merges).toHaveLength(0)
  })

  it('stops chain when value would exceed 1024', () => {
    const board = createEmptyBoard()
    board[4][0] = 512
    board[4][1] = 512

    const { board: result, merges } = resolveChains(board, { row: 4, col: 0 })
    expect(merges).toHaveLength(1)
    expect(merges[0].resultValue).toBe(1024)
  })
})

describe('checkGameOver', () => {
  it('returns false for an empty board', () => {
    expect(checkGameOver(createEmptyBoard())).toBe(false)
  })

  it('returns false when full board has adjacent same values', () => {
    const board = makeBoard(
      Array.from({ length: BOARD_SIZE }, () =>
        Array.from({ length: BOARD_SIZE }, () => 2)
      )
    )
    expect(checkGameOver(board)).toBe(false)
  })

  it('returns true when full board has no adjacent matches', () => {
    const board = makeBoard(
      Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => ((r + c) % 2 === 0 ? 2 : 4))
      )
    )
    expect(checkGameOver(board)).toBe(true)
  })

  it('returns false when one cell is empty', () => {
    const board = makeBoard(
      Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => ((r + c) % 2 === 0 ? 2 : 4))
      )
    )
    board[0][0] = null
    expect(checkGameOver(board)).toBe(false)
  })
})
