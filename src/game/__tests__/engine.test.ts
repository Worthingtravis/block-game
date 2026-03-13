import { describe, it, expect } from 'vitest'
import { createEmptyBoard, isValidPlacement, stampPiece, findClears, applyClear, canAnyPieceFit } from '../engine'
import { BOARD_SIZE } from '../types'
import type { Piece, Board } from '../types'

const testPiece: Piece = {
  id: 'test-1',
  shape: 'line3h',
  color: 'blue',
  cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
}

describe('createEmptyBoard', () => {
  it('creates a 10x10 board of nulls', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(BOARD_SIZE)
    board.forEach(row => {
      expect(row).toHaveLength(BOARD_SIZE)
      row.forEach(cell => expect(cell).toBeNull())
    })
  })
})

describe('isValidPlacement', () => {
  it('returns true for valid placement on empty board', () => {
    const board = createEmptyBoard()
    expect(isValidPlacement(board, testPiece, { row: 0, col: 0 })).toBe(true)
  })

  it('returns true for placement at bottom-right that fits', () => {
    const board = createEmptyBoard()
    expect(isValidPlacement(board, testPiece, { row: BOARD_SIZE - 1, col: BOARD_SIZE - 3 })).toBe(true)
  })

  it('returns false when piece goes out of bounds (right)', () => {
    const board = createEmptyBoard()
    expect(isValidPlacement(board, testPiece, { row: 0, col: BOARD_SIZE - 2 })).toBe(false)
  })

  it('returns false when piece goes out of bounds (bottom)', () => {
    const board = createEmptyBoard()
    const vertPiece: Piece = {
      id: 'test-v', shape: 'line3v', color: 'green',
      cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
    }
    expect(isValidPlacement(board, vertPiece, { row: BOARD_SIZE - 2, col: 0 })).toBe(false)
  })

  it('returns false when cell is already occupied', () => {
    const board = createEmptyBoard()
    board[0][1] = 'orange'
    expect(isValidPlacement(board, testPiece, { row: 0, col: 0 })).toBe(false)
  })
})

describe('stampPiece', () => {
  it('places piece cells on the board', () => {
    const board = createEmptyBoard()
    const newBoard = stampPiece(board, testPiece, { row: 2, col: 3 })
    expect(newBoard[2][3]).toBe('blue')
    expect(newBoard[2][4]).toBe('blue')
    expect(newBoard[2][5]).toBe('blue')
    expect(board[2][3]).toBeNull()
  })
})

describe('findClears', () => {
  it('returns empty result when no lines are full', () => {
    const board = createEmptyBoard()
    const result = findClears(board)
    expect(result.linesCleared).toBe(0)
    expect(result.clearedCells).toEqual([])
  })

  it('detects a full row', () => {
    const board = createEmptyBoard()
    for (let col = 0; col < BOARD_SIZE; col++) board[3][col] = 'blue'
    const result = findClears(board)
    expect(result.clearedRows).toEqual([3])
    expect(result.clearedCols).toEqual([])
    expect(result.linesCleared).toBe(1)
    expect(result.clearedCells).toHaveLength(BOARD_SIZE)
  })

  it('detects a full column', () => {
    const board = createEmptyBoard()
    for (let row = 0; row < BOARD_SIZE; row++) board[row][5] = 'green'
    const result = findClears(board)
    expect(result.clearedRows).toEqual([])
    expect(result.clearedCols).toEqual([5])
    expect(result.linesCleared).toBe(1)
  })

  it('detects row and column simultaneously with deduplicated cells', () => {
    const board = createEmptyBoard()
    for (let col = 0; col < BOARD_SIZE; col++) board[3][col] = 'blue'
    for (let row = 0; row < BOARD_SIZE; row++) board[row][5] = 'green'
    const result = findClears(board)
    expect(result.clearedRows).toEqual([3])
    expect(result.clearedCols).toEqual([5])
    expect(result.linesCleared).toBe(2)
    expect(result.clearedCells).toHaveLength(BOARD_SIZE * 2 - 1) // row+col minus intersection
  })
})

describe('applyClear', () => {
  it('sets cleared cells to null', () => {
    const board = createEmptyBoard()
    for (let col = 0; col < BOARD_SIZE; col++) board[0][col] = 'purple'
    const clears = findClears(board)
    const newBoard = applyClear(board, clears)
    for (let col = 0; col < BOARD_SIZE; col++) expect(newBoard[0][col]).toBeNull()
    expect(board[0][0]).toBe('purple')
  })
})

describe('canAnyPieceFit', () => {
  it('returns true when board is empty', () => {
    const board = createEmptyBoard()
    const piece: Piece = { id: 'test', shape: 'single', color: 'blue', cells: [{ row: 0, col: 0 }] }
    expect(canAnyPieceFit(board, [piece])).toBe(true)
  })

  it('returns false when board is full', () => {
    const board = createEmptyBoard()
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = 'blue'
    const piece: Piece = { id: 'test', shape: 'single', color: 'blue', cells: [{ row: 0, col: 0 }] }
    expect(canAnyPieceFit(board, [piece])).toBe(false)
  })

  it('returns true when only one piece fits', () => {
    const board = createEmptyBoard()
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = 'blue'
    board[0][0] = null
    const single: Piece = { id: 'single', shape: 'single', color: 'green', cells: [{ row: 0, col: 0 }] }
    const line: Piece = { id: 'line', shape: 'line3h', color: 'blue', cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }] }
    expect(canAnyPieceFit(board, [single, line])).toBe(true)
  })

  it('skips null entries in pieces array', () => {
    const board = createEmptyBoard()
    expect(canAnyPieceFit(board, [null])).toBe(false)
  })
})
