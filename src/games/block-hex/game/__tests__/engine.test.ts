import { describe, it, expect } from 'vitest'
import {
  createEmptyBoard,
  ADJACENCY,
  getTopColor,
  findMatches,
  applyMatches,
  placeTile,
  checkGameOver,
} from '../engine'
import type { Board } from '../types'

describe('createEmptyBoard', () => {
  it('returns 19 empty stacks', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(19)
    board.forEach(stack => expect(stack).toEqual([]))
  })
})

describe('ADJACENCY', () => {
  it('has 19 entries', () => {
    expect(ADJACENCY).toHaveLength(19)
  })

  it('cell 9 (center) has 6 neighbors', () => {
    expect(ADJACENCY[9]).toHaveLength(6)
    expect(ADJACENCY[9].sort((a, b) => a - b)).toEqual([4, 5, 8, 10, 13, 14])
  })

  it('cell 0 (corner) has 3 neighbors', () => {
    expect(ADJACENCY[0]).toHaveLength(3)
    expect(ADJACENCY[0].sort((a, b) => a - b)).toEqual([1, 3, 4])
  })

  it('cell 18 (corner) has 3 neighbors', () => {
    expect(ADJACENCY[18]).toHaveLength(3)
    expect(ADJACENCY[18].sort((a, b) => a - b)).toEqual([14, 15, 17])
  })
})

describe('getTopColor', () => {
  it('returns null for empty cell', () => {
    const board = createEmptyBoard()
    expect(getTopColor(board, 5)).toBeNull()
  })

  it('returns top of stack', () => {
    const board = createEmptyBoard()
    board[5] = ['blue', 'red']
    expect(getTopColor(board, 5)).toBe('red')
  })

  it('returns single element for stack of length 1', () => {
    const board = createEmptyBoard()
    board[0] = ['green']
    expect(getTopColor(board, 0)).toBe('green')
  })
})

describe('findMatches', () => {
  it('returns empty when no matches', () => {
    const board = createEmptyBoard()
    board[0] = ['blue']
    board[1] = ['red']
    expect(findMatches(board)).toEqual([])
  })

  it('finds adjacent same-color tops', () => {
    const board = createEmptyBoard()
    board[0] = ['blue']
    board[1] = ['blue']  // 0 and 1 are adjacent
    const matches = findMatches(board)
    expect(matches).toHaveLength(1)
    expect(matches[0]).toEqual([0, 1])
  })

  it('returns empty when board is empty', () => {
    const board = createEmptyBoard()
    expect(findMatches(board)).toEqual([])
  })

  it('finds multiple matching pairs', () => {
    const board = createEmptyBoard()
    // cells 0, 1, 2 in a chain: 0-1 adjacent, 1-2 adjacent
    board[0] = ['yellow']
    board[1] = ['yellow']
    board[2] = ['yellow']
    const matches = findMatches(board)
    // Should find [0,1] and [1,2]
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })
})

describe('applyMatches', () => {
  it('removes top layer from matched cells', () => {
    const board = createEmptyBoard()
    board[0] = ['green', 'blue']
    board[1] = ['red', 'blue']
    const pairs: [number, number][] = [[0, 1]]
    const { board: newBoard, cleared } = applyMatches(board, pairs)
    expect(newBoard[0]).toEqual(['green'])
    expect(newBoard[1]).toEqual(['red'])
    expect(cleared).toBe(2)
  })

  it('handles cell appearing in multiple pairs (only removes once)', () => {
    const board = createEmptyBoard()
    // cell 4 is adjacent to 0, 1, 3, 5, 8, 9
    board[0] = ['blue']
    board[1] = ['blue']
    board[4] = ['blue']
    // pairs: [0,4] and [1,4] — cell 4 appears in both
    const pairs: [number, number][] = [[0, 4], [1, 4]]
    const { board: newBoard, cleared } = applyMatches(board, pairs)
    // cell 4 should only lose one layer
    expect(newBoard[4]).toEqual([])
    expect(newBoard[0]).toEqual([])
    expect(newBoard[1]).toEqual([])
    // 3 unique cells cleared
    expect(cleared).toBe(3)
  })

  it('does not mutate the original board', () => {
    const board = createEmptyBoard()
    board[0] = ['red']
    board[1] = ['red']
    const pairs: [number, number][] = [[0, 1]]
    applyMatches(board, pairs)
    expect(board[0]).toEqual(['red'])
    expect(board[1]).toEqual(['red'])
  })
})

describe('placeTile', () => {
  it('places tile on empty cell', () => {
    const board = createEmptyBoard()
    const newBoard = placeTile(board, 7, ['blue', 'red'])
    expect(newBoard).not.toBeNull()
    expect(newBoard![7]).toEqual(['blue', 'red'])
  })

  it('returns null on occupied cell', () => {
    const board = createEmptyBoard()
    board[7] = ['green']
    const result = placeTile(board, 7, ['blue'])
    expect(result).toBeNull()
  })

  it('does not mutate the original board', () => {
    const board = createEmptyBoard()
    placeTile(board, 3, ['purple'])
    expect(board[3]).toEqual([])
  })
})

describe('checkGameOver', () => {
  it('returns false with empty cells', () => {
    const board = createEmptyBoard()
    expect(checkGameOver(board)).toBe(false)
  })

  it('returns false when full but matches exist', () => {
    // Fill all 19 cells with the same color — lots of matches
    const board: Board = Array.from({ length: 19 }, () => ['blue'])
    expect(checkGameOver(board)).toBe(false)
  })

  it('returns true when board is full with no adjacent matching tops', () => {
    // Fill all 19 cells with a valid graph-coloring of the hex adjacency graph
    // so no two adjacent cells share the same top color.
    // Coloring derived by greedy assignment through the adjacency graph:
    //   0=blue,  1=red,    2=yellow, 3=yellow, 4=green,  5=blue,  6=red,
    //   7=red,   8=purple, 9=red,    10=yellow,11=blue,
    //   12=yellow,13=blue, 14=green, 15=red,
    //   16=red,  17=yellow,18=blue
    const colorMap: Record<number, 'blue' | 'red' | 'yellow' | 'green' | 'purple'> = {
      0:  'blue',   1: 'red',    2: 'yellow',
      3:  'yellow', 4: 'green',  5: 'blue',   6: 'red',
      7:  'red',    8: 'purple', 9: 'red',    10: 'yellow', 11: 'blue',
      12: 'yellow', 13: 'blue',  14: 'green',  15: 'red',
      16: 'red',    17: 'yellow', 18: 'blue',
    }
    const board: Board = Array.from({ length: 19 }, (_, i) => [colorMap[i]])
    expect(checkGameOver(board)).toBe(true)
  })

  it('returns false when partially filled with matches', () => {
    const board = createEmptyBoard()
    board[0] = ['purple']
    board[1] = ['purple']  // 0 and 1 are adjacent
    expect(checkGameOver(board)).toBe(false)
  })
})
