import type { Board, ClaireCell, ClaireColor } from './types'
import { BOARD_SIZE, CLAIRE_COLORS } from './types'

function emptyCell(): ClaireCell {
  return { color: null, obstacle: false, highlighted: false }
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => emptyCell())
  )
}

export function createRandomBoard(colorCount: number): Board {
  const count = Math.min(Math.max(colorCount, 2), CLAIRE_COLORS.length)
  const colors = CLAIRE_COLORS.slice(0, count) as ClaireColor[]
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      color: colors[Math.floor(Math.random() * colors.length)],
      obstacle: false,
      highlighted: false,
    }))
  )
}

export function findGroup(board: Board, row: number, col: number): [number, number][] {
  const target = board[row]?.[col]?.color
  if (target === null || target === undefined) return []

  const visited = new Set<string>()
  const result: [number, number][] = []
  const queue: [number, number][] = [[row, col]]

  while (queue.length > 0) {
    const [r, c] = queue.shift()!
    const key = `${r},${c}`
    if (visited.has(key)) continue
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue
    if (board[r][c].color !== target) continue
    if (board[r][c].obstacle) continue

    visited.add(key)
    result.push([r, c])

    queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1])
  }

  return result
}

export function clearGroup(board: Board, cells: [number, number][]): Board {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })))
  for (const [r, c] of cells) {
    newBoard[r][c] = { ...newBoard[r][c], color: null }
  }
  return newBoard
}

export function applyGravity(board: Board): Board {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })))
  for (let col = 0; col < BOARD_SIZE; col++) {
    // Collect non-null cells top-to-bottom (preserves relative order)
    const filled: ClaireCell[] = []
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (newBoard[row][col].color !== null || newBoard[row][col].obstacle) {
        filled.push({ ...newBoard[row][col] })
      }
    }
    // Place them at the bottom of the column
    const emptyCount = BOARD_SIZE - filled.length
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (row < emptyCount) {
        newBoard[row][col] = emptyCell()
      } else {
        newBoard[row][col] = filled[row - emptyCount]
      }
    }
  }
  return newBoard
}

export function fillEmpty(board: Board, colorCount: number): Board {
  const count = Math.min(Math.max(colorCount, 2), CLAIRE_COLORS.length)
  const colors = CLAIRE_COLORS.slice(0, count) as ClaireColor[]
  const newBoard = board.map(row => row.map(cell => ({ ...cell })))
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (newBoard[r][c].color === null && !newBoard[r][c].obstacle) {
        newBoard[r][c] = {
          ...newBoard[r][c],
          color: colors[Math.floor(Math.random() * colors.length)],
        }
      }
    }
  }
  return newBoard
}

export function findIsolated(board: Board, row: number, col: number): boolean {
  const color = board[row]?.[col]?.color
  if (!color) return false

  const neighbors: [number, number][] = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ]

  for (const [r, c] of neighbors) {
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      if (board[r][c].color === color && !board[r][c].obstacle) {
        return false
      }
    }
  }

  return true
}

export function hasValidMoves(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].color !== null && !board[r][c].obstacle) {
        const group = findGroup(board, r, c)
        if (group.length >= 3) return true
      }
    }
  }
  return false
}

export function countEmpty(board: Board): number {
  let count = 0
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].color === null && !board[r][c].obstacle) count++
    }
  }
  return count
}
