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

export function applyBomb(board: Board, position: Cell): { board: Board; clearResult: ClearResult } {
  const newBoard = board.map(row => [...row])
  const cellSet = new Set<string>()
  const clearedCells: Cell[] = []

  const addCell = (row: number, col: number) => {
    const key = `${row},${col}`
    if (!cellSet.has(key) && newBoard[row][col] !== null) {
      cellSet.add(key)
      clearedCells.push({ row, col })
      newBoard[row][col] = null
    }
  }

  // 3x3 blast radius around drop point
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = position.row + dr
      const c = position.col + dc
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) addCell(r, c)
    }
  }

  // Clear entire row and column through the bomb position
  for (let col = 0; col < BOARD_SIZE; col++) addCell(position.row, col)
  for (let row = 0; row < BOARD_SIZE; row++) addCell(row, position.col)

  return {
    board: newBoard,
    clearResult: {
      clearedRows: [position.row],
      clearedCols: [position.col],
      clearedCells,
      linesCleared: clearedCells.length > 0 ? 2 : 0,
    },
  }
}

export function canAllPiecesFit(board: Board, pieces: Piece[]): boolean {
  if (pieces.length === 0) return true
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i]
    const rest = [...pieces.slice(0, i), ...pieces.slice(i + 1)]
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!isValidPlacement(board, piece, { row, col })) continue
        let nextBoard = stampPiece(board, piece, { row, col })
        const clears = findClears(nextBoard)
        if (clears.linesCleared > 0) nextBoard = applyClear(nextBoard, clears)
        if (canAllPiecesFit(nextBoard, rest)) return true
      }
    }
  }
  return false
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
