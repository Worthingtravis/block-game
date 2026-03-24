import type { Board, Cell, MergeResult } from './types'
import { BOARD_SIZE } from './types'

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  )
}

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const

/** BFS flood-fill for orthogonally-adjacent cells with the same value. */
export function findMergeGroup(board: Board, origin: Cell): Cell[] {
  const value = board[origin.row][origin.col]
  if (value === null) return []

  const visited = new Set<string>()
  const queue: Cell[] = [origin]
  const group: Cell[] = []
  visited.add(`${origin.row},${origin.col}`)

  while (queue.length > 0) {
    const cur = queue.shift()!
    group.push(cur)
    for (const [dr, dc] of DIRS) {
      const nr = cur.row + dr, nc = cur.col + dc
      const key = `${nr},${nc}`
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !visited.has(key) && board[nr][nc] === value) {
        visited.add(key)
        queue.push({ row: nr, col: nc })
      }
    }
  }

  return group.length >= 2 ? group : []
}

/** Find a merge on the board, preferring the given cell as the merge target. */
export function findAnyMerge(board: Board, prefer?: Cell): { origin: Cell; group: Cell[] } | null {
  // Check preferred cell first (where the new block landed)
  if (prefer && board[prefer.row]?.[prefer.col] !== null) {
    const group = findMergeGroup(board, prefer)
    if (group.length >= 2) return { origin: prefer, group }
  }

  // Scan entire board bottom-up
  const checked = new Set<string>()
  for (let r = BOARD_SIZE - 1; r >= 0; r--) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r},${c}`
      if (checked.has(key) || board[r][c] === null) continue
      const group = findMergeGroup(board, { row: r, col: c })
      if (group.length >= 2) {
        const origin = group.reduce((a, b) => a.row > b.row ? a : b)
        return { origin, group }
      }
      for (const cell of group) checked.add(`${cell.row},${cell.col}`)
    }
  }
  return null
}

/** Apply a single merge: consume group, place result at origin. */
export function applyMerge(board: Board, origin: Cell, group: Cell[]): { board: Board; merge: MergeResult } {
  const sourceValue = board[origin.row][origin.col] as number
  // Group size determines levels: 2 cells = ×2, 3 cells = ×4, 4 cells = ×8, etc.
  const levelsUp = Math.max(group.length - 1, 1)
  const resultValue = sourceValue * Math.pow(2, levelsUp)

  const newBoard = board.map(row => [...row])
  for (const cell of group) newBoard[cell.row][cell.col] = null
  newBoard[origin.row][origin.col] = resultValue

  const mergedCells = group.filter(c => !(c.row === origin.row && c.col === origin.col))

  return {
    board: newBoard,
    merge: { mergedCells, resultCell: origin, sourceValue, resultValue, groupSize: group.length },
  }
}

/** Apply gravity — blocks fall down. */
export function applyGravity(board: Board): { board: Board; moved: boolean } {
  const newBoard = board.map(row => [...row])
  let moved = false
  for (let col = 0; col < BOARD_SIZE; col++) {
    let writeRow = BOARD_SIZE - 1
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      if (newBoard[row][col] !== null) {
        if (row !== writeRow) {
          newBoard[writeRow][col] = newBoard[row][col]
          newBoard[row][col] = null
          moved = true
        }
        writeRow--
      }
    }
  }
  return { board: newBoard, moved }
}

/** Drop a block into a column — returns the row it lands on, or -1 if truly full.
 *  If the column is full but the top block matches the incoming value, merge them. */
export function dropBlock(board: Board, col: number, value: number): { board: Board; row: number } {
  for (let r = BOARD_SIZE - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      const newBoard = board.map(row => [...row])
      newBoard[r][col] = value
      return { board: newBoard, row: r }
    }
  }
  // Column is full — check if the top block matches for an instant merge
  if (board[0][col] === value) {
    const newBoard = board.map(row => [...row])
    // Replace top block with merged value (value × 2)
    newBoard[0][col] = value * 2
    return { board: newBoard, row: 0 }
  }
  return { board, row: -1 }
}

/** True when every cell is filled and no adjacent pair matches. */
export function checkGameOver(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) return false
      const val = board[r][c]
      if (c + 1 < BOARD_SIZE && board[r][c + 1] === val) return false
      if (r + 1 < BOARD_SIZE && board[r + 1][c] === val) return false
    }
  }
  return true
}

/** Check if a value exists anywhere on the board. */
function boardHasValue(board: Board, value: number): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === value) return true
    }
  }
  return false
}

/**
 * Progressive block value generation.
 * Before phasing out a value, checks if it still exists on the board.
 * If it does, keeps offering it so the player can merge it away.
 */
export function generateNextValue(score: number, board?: Board): number {
  const rand = Math.random()

  // If the board still has 2s, keep offering them regardless of score
  const has2s = board ? boardHasValue(board, 2) : true

  if (score >= 2000) {
    if (has2s && rand < 0.15) return 2
    return rand < 0.15 ? 16 : rand < 0.55 ? 8 : 4
  }
  if (score >= 1000) {
    if (has2s && rand < 0.2) return 2
    return rand < 0.3 ? 8 : 4
  }
  if (score >= 500) {
    if (has2s) return rand < 0.4 ? 2 : 4
    return rand < 0.15 ? 2 : 4
  }
  if (score >= 200) return rand < 0.5 ? 2 : 4
  return rand < 0.7 ? 2 : 4
}
