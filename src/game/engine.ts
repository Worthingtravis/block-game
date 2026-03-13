import type { Board, Cell, Piece, ClearResult } from './types'
import { BOARD_SIZE } from './types'

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  )
}

export function isValidPlacement(board: Board, piece: Piece, position: Cell): boolean {
  for (const cell of piece.cells) {
    const row = position.row + cell.row
    const col = position.col + cell.col
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false
    if (board[row][col] !== null) return false
  }
  return true
}

export function stampPiece(board: Board, piece: Piece, position: Cell): Board {
  const newBoard = board.map(row => [...row])
  for (const cell of piece.cells) {
    newBoard[position.row + cell.row][position.col + cell.col] = piece.color
  }
  return newBoard
}

export function findClears(board: Board): ClearResult {
  const clearedRows: number[] = []
  const clearedCols: number[] = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    if (board[row].every(cell => cell !== null)) clearedRows.push(row)
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    let full = true
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (board[row][col] === null) { full = false; break }
    }
    if (full) clearedCols.push(col)
  }

  const cellSet = new Set<string>()
  const clearedCells: Cell[] = []

  for (const row of clearedRows) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row},${col}`
      if (!cellSet.has(key)) { cellSet.add(key); clearedCells.push({ row, col }) }
    }
  }
  for (const col of clearedCols) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      const key = `${row},${col}`
      if (!cellSet.has(key)) { cellSet.add(key); clearedCells.push({ row, col }) }
    }
  }

  return { clearedRows, clearedCols, clearedCells, linesCleared: clearedRows.length + clearedCols.length }
}

export function applyClear(board: Board, clearResult: ClearResult): Board {
  const newBoard = board.map(row => [...row])
  for (const { row, col } of clearResult.clearedCells) newBoard[row][col] = null
  return newBoard
}

export function canAnyPieceFit(board: Board, pieces: (Piece | null)[]): boolean {
  for (const piece of pieces) {
    if (piece === null) continue
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidPlacement(board, piece, { row, col })) return true
      }
    }
  }
  return false
}
