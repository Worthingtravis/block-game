import { describe, it, expect } from 'vitest'
import {
  createEmptyBoard,
  createRandomBoard,
  findGroup,
  clearGroup,
  applyGravity,
  fillEmpty,
  findIsolated,
  hasValidMoves,
  countEmpty,
} from '../engine'
import { BOARD_SIZE, CLAIRE_COLORS } from '../types'
import type { Board } from '../types'

function solidBoard(color: (typeof CLAIRE_COLORS)[number]): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ color, obstacle: false, highlighted: false }))
  )
}

describe('createEmptyBoard', () => {
  it('creates a 6x6 board', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(BOARD_SIZE)
    board.forEach(row => expect(row).toHaveLength(BOARD_SIZE))
  })

  it('all cells start empty', () => {
    const board = createEmptyBoard()
    board.forEach(row =>
      row.forEach(cell => {
        expect(cell.color).toBeNull()
        expect(cell.obstacle).toBe(false)
        expect(cell.highlighted).toBe(false)
      })
    )
  })
})

describe('createRandomBoard', () => {
  it('creates a fully filled board', () => {
    const board = createRandomBoard(3)
    board.forEach(row => row.forEach(cell => expect(cell.color).not.toBeNull()))
  })

  it('only uses the specified number of colors', () => {
    const board = createRandomBoard(2)
    const usedColors = new Set<string>()
    board.forEach(row => row.forEach(cell => { if (cell.color) usedColors.add(cell.color) }))
    expect(usedColors.size).toBeLessThanOrEqual(2)
  })

  it('clamps colorCount to at least 2', () => {
    const board = createRandomBoard(1)
    board.forEach(row => row.forEach(cell => expect(cell.color).not.toBeNull()))
  })

  it('clamps colorCount to max available colors', () => {
    const board = createRandomBoard(999)
    board.forEach(row => row.forEach(cell => expect(cell.color).not.toBeNull()))
  })
})

describe('findGroup', () => {
  it('returns empty for null cell', () => {
    const board = createEmptyBoard()
    expect(findGroup(board, 0, 0)).toEqual([])
  })

  it('returns single cell when no neighbors match', () => {
    const board = createEmptyBoard()
    board[0][0] = { color: 'rose', obstacle: false, highlighted: false }
    board[0][1] = { color: 'sky', obstacle: false, highlighted: false }
    board[1][0] = { color: 'sky', obstacle: false, highlighted: false }
    const group = findGroup(board, 0, 0)
    expect(group).toHaveLength(1)
    expect(group[0]).toEqual([0, 0])
  })

  it('finds a connected group of same-color cells', () => {
    const board = createEmptyBoard()
    board[0][0] = { color: 'rose', obstacle: false, highlighted: false }
    board[0][1] = { color: 'rose', obstacle: false, highlighted: false }
    board[0][2] = { color: 'rose', obstacle: false, highlighted: false }
    const group = findGroup(board, 0, 0)
    expect(group).toHaveLength(3)
  })

  it('does not cross through obstacles', () => {
    const board = createEmptyBoard()
    board[0][0] = { color: 'rose', obstacle: false, highlighted: false }
    board[0][1] = { color: 'rose', obstacle: true, highlighted: false }
    board[0][2] = { color: 'rose', obstacle: false, highlighted: false }
    const group = findGroup(board, 0, 0)
    expect(group).toHaveLength(1)
  })

  it('only finds orthogonally adjacent cells (not diagonal)', () => {
    const board = createEmptyBoard()
    board[0][0] = { color: 'amber', obstacle: false, highlighted: false }
    board[1][1] = { color: 'amber', obstacle: false, highlighted: false }
    const group = findGroup(board, 0, 0)
    expect(group).toHaveLength(1)
  })
})

describe('clearGroup', () => {
  it('sets cleared cells to null', () => {
    const board = createEmptyBoard()
    board[0][0] = { color: 'rose', obstacle: false, highlighted: false }
    board[0][1] = { color: 'rose', obstacle: false, highlighted: false }
    const newBoard = clearGroup(board, [[0, 0], [0, 1]])
    expect(newBoard[0][0].color).toBeNull()
    expect(newBoard[0][1].color).toBeNull()
  })

  it('does not mutate the original board', () => {
    const board = createEmptyBoard()
    board[0][0] = { color: 'sky', obstacle: false, highlighted: false }
    clearGroup(board, [[0, 0]])
    expect(board[0][0].color).toBe('sky')
  })
})

describe('applyGravity', () => {
  it('drops tiles down to fill empty cells below', () => {
    const board = createEmptyBoard()
    // Place a color at row 0, nothing below it
    board[0][0] = { color: 'mint', obstacle: false, highlighted: false }
    const newBoard = applyGravity(board)
    // The tile should fall to the bottom row
    expect(newBoard[BOARD_SIZE - 1][0].color).toBe('mint')
    expect(newBoard[0][0].color).toBeNull()
  })

  it('does not move tiles that are already at the bottom', () => {
    const board = createEmptyBoard()
    board[BOARD_SIZE - 1][0] = { color: 'violet', obstacle: false, highlighted: false }
    const newBoard = applyGravity(board)
    expect(newBoard[BOARD_SIZE - 1][0].color).toBe('violet')
  })

  it('preserves relative order of stacked tiles', () => {
    const board = createEmptyBoard()
    board[0][0] = { color: 'rose', obstacle: false, highlighted: false }
    board[2][0] = { color: 'sky', obstacle: false, highlighted: false }
    const newBoard = applyGravity(board)
    // sky was lower (row 2), so it lands at the very bottom; rose was above (row 0), lands above sky
    expect(newBoard[BOARD_SIZE - 1][0].color).toBe('sky')
    expect(newBoard[BOARD_SIZE - 2][0].color).toBe('rose')
  })
})

describe('fillEmpty', () => {
  it('fills all empty cells', () => {
    const board = createEmptyBoard()
    const filled = fillEmpty(board, 3)
    expect(countEmpty(filled)).toBe(0)
  })

  it('does not overwrite existing cells', () => {
    const board = solidBoard('rose')
    const filled = fillEmpty(board, 5)
    filled.forEach(row => row.forEach(cell => expect(cell.color).toBe('rose')))
  })
})

describe('findIsolated', () => {
  it('returns true when no same-color neighbors', () => {
    const board = createEmptyBoard()
    board[1][1] = { color: 'rose', obstacle: false, highlighted: false }
    board[0][1] = { color: 'sky', obstacle: false, highlighted: false }
    board[2][1] = { color: 'sky', obstacle: false, highlighted: false }
    board[1][0] = { color: 'sky', obstacle: false, highlighted: false }
    board[1][2] = { color: 'sky', obstacle: false, highlighted: false }
    expect(findIsolated(board, 1, 1)).toBe(true)
  })

  it('returns false when at least one same-color neighbor exists', () => {
    const board = createEmptyBoard()
    board[1][1] = { color: 'rose', obstacle: false, highlighted: false }
    board[1][2] = { color: 'rose', obstacle: false, highlighted: false }
    expect(findIsolated(board, 1, 1)).toBe(false)
  })

  it('returns false for null cell', () => {
    const board = createEmptyBoard()
    expect(findIsolated(board, 0, 0)).toBe(false)
  })
})

describe('hasValidMoves', () => {
  it('returns false when no group of 3+ exists', () => {
    const board = createEmptyBoard()
    // Checkerboard pattern — no adjacent same-color pairs let alone triples
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        board[r][c] = { color: (r + c) % 2 === 0 ? 'rose' : 'sky', obstacle: false, highlighted: false }
      }
    }
    expect(hasValidMoves(board)).toBe(false)
  })

  it('returns true when a group of 3+ exists', () => {
    const board = createEmptyBoard()
    board[0][0] = { color: 'amber', obstacle: false, highlighted: false }
    board[0][1] = { color: 'amber', obstacle: false, highlighted: false }
    board[0][2] = { color: 'amber', obstacle: false, highlighted: false }
    expect(hasValidMoves(board)).toBe(true)
  })
})

describe('countEmpty', () => {
  it('counts all cells on empty board', () => {
    const board = createEmptyBoard()
    expect(countEmpty(board)).toBe(BOARD_SIZE * BOARD_SIZE)
  })

  it('counts zero on full board', () => {
    const board = solidBoard('violet')
    expect(countEmpty(board)).toBe(0)
  })

  it('does not count obstacle cells as empty', () => {
    const board = createEmptyBoard()
    board[0][0] = { color: null, obstacle: true, highlighted: false }
    // obstacle cells without color are not "empty" in the fillable sense
    expect(countEmpty(board)).toBe(BOARD_SIZE * BOARD_SIZE - 1)
  })
})
