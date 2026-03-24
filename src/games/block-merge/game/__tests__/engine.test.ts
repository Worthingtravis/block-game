import { describe, it, expect } from 'vitest'
import { createEmptyBoard, findMergeGroup, findAnyMerge, applyMerge, applyGravity, dropBlock, checkGameOver } from '../engine'
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
  it('finds adjacent same-value cells', () => {
    const board = createEmptyBoard()
    board[4][0] = 2; board[4][1] = 2; board[4][2] = 2
    const group = findMergeGroup(board, { row: 4, col: 0 })
    expect(group).toHaveLength(3)
  })

  it('returns empty for isolated cell', () => {
    const board = createEmptyBoard()
    board[4][2] = 4
    expect(findMergeGroup(board, { row: 4, col: 2 })).toHaveLength(0)
  })

  it('does not include diagonals', () => {
    const board = createEmptyBoard()
    board[3][0] = 8; board[4][1] = 8
    expect(findMergeGroup(board, { row: 3, col: 0 })).toHaveLength(0)
  })
})

describe('findAnyMerge', () => {
  it('finds a merge on the board', () => {
    const board = createEmptyBoard()
    board[4][0] = 2; board[4][1] = 2
    const result = findAnyMerge(board)
    expect(result).not.toBeNull()
    expect(result!.group).toHaveLength(2)
  })

  it('returns null when no merges exist', () => {
    const board = createEmptyBoard()
    board[4][0] = 2; board[4][2] = 2
    expect(findAnyMerge(board)).toBeNull()
  })
})

describe('applyMerge', () => {
  it('two same cells merge to next value', () => {
    const board = createEmptyBoard()
    board[4][0] = 2; board[4][1] = 2
    const group = findMergeGroup(board, { row: 4, col: 0 })
    const { board: result, merge } = applyMerge(board, { row: 4, col: 0 }, group)
    expect(merge.resultValue).toBe(4)
    expect(result[4][0]).toBe(4)
    expect(result[4][1]).toBeNull()
  })

  it('three same cells merge up two levels', () => {
    const board = createEmptyBoard()
    board[4][0] = 2; board[4][1] = 2; board[4][2] = 2
    const group = findMergeGroup(board, { row: 4, col: 1 })
    const { merge } = applyMerge(board, { row: 4, col: 1 }, group)
    expect(merge.resultValue).toBe(8)
  })
})

describe('dropBlock', () => {
  it('drops to the bottom of an empty column', () => {
    const board = createEmptyBoard()
    const { board: result, row } = dropBlock(board, 2, 4)
    expect(row).toBe(BOARD_SIZE - 1)
    expect(result[BOARD_SIZE - 1][2]).toBe(4)
  })

  it('stacks on existing blocks', () => {
    const board = createEmptyBoard()
    board[4][2] = 2
    const { row } = dropBlock(board, 2, 4)
    expect(row).toBe(3)
  })

  it('returns -1 for full column', () => {
    const board = createEmptyBoard()
    for (let r = 0; r < BOARD_SIZE; r++) board[r][0] = 2
    const { row } = dropBlock(board, 0, 4)
    expect(row).toBe(-1)
  })
})

describe('applyGravity', () => {
  it('drops blocks to bottom', () => {
    const board = createEmptyBoard()
    board[0][0] = 2; board[2][0] = 4
    const { board: result, moved } = applyGravity(board)
    expect(moved).toBe(true)
    expect(result[3][0]).toBe(2)
    expect(result[4][0]).toBe(4)
  })
})

describe('checkGameOver', () => {
  it('false for empty board', () => {
    expect(checkGameOver(createEmptyBoard())).toBe(false)
  })

  it('false when full with adjacent matches', () => {
    const board = makeBoard(
      Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 2))
    )
    expect(checkGameOver(board)).toBe(false)
  })

  it('true when full with no matches', () => {
    const board = makeBoard(
      Array.from({ length: BOARD_SIZE }, (_, r) =>
        Array.from({ length: BOARD_SIZE }, (_, c) => ((r + c) % 2 === 0 ? 2 : 4))
      )
    )
    expect(checkGameOver(board)).toBe(true)
  })
})
