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

/** Drop a block into a column. If column is full but top matches, merge instantly. */
export function dropBlock(board: Board, col: number, value: number): { board: Board; row: number; instantMerge: boolean } {
  for (let r = BOARD_SIZE - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      const newBoard = board.map(row => [...row])
      newBoard[r][col] = value
      return { board: newBoard, row: r, instantMerge: false }
    }
  }
  if (board[0][col] === value) {
    const newBoard = board.map(row => [...row])
    newBoard[0][col] = value * 2
    return { board: newBoard, row: 0, instantMerge: true }
  }
  return { board, row: -1, instantMerge: false }
}

/** True when the current block has no valid placement — board full, no empty cells,
 *  no adjacent matches, and the current queue block can't merge onto any column top. */
export function checkGameOver(board: Board, currentBlock?: number): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) return false
      const val = board[r][c]
      if (c + 1 < BOARD_SIZE && board[r][c + 1] === val) return false
      if (r + 1 < BOARD_SIZE && board[r + 1][c] === val) return false
    }
  }
  // Board is full with no adjacent matches — check if the CURRENT block can merge onto a column top
  if (currentBlock != null) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[0][c] === currentBlock) return false
    }
  }
  return true
}

/** Remove all cells with a given value from the board. */
export function purgeValue(board: Board, value: number): Board {
  return board.map(row => row.map(cell => cell === value ? null : cell))
}

/** Generate next block value, respecting the minimum value.
 *  Spawns minValue (60%) or minValue*2 (40%) — scales forever. */
export function generateNextValue(_score: number, minValue = 2): number {
  const rand = Math.random()
  return rand < 0.6 ? minValue : minValue * 2
}

/** Clear a 3x3 area centered on (row, col), clamped to board edges. Returns new board and destroyed cell values. */
export function applyBomb(board: Board, row: number, col: number): { board: Board; destroyed: number[] } {
  const next = board.map(r => [...r])
  const destroyed: number[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr
      const c = col + dc
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && next[r][c] !== null) {
        destroyed.push(next[r][c]!)
        next[r][c] = null
      }
    }
  }
  return { board: next, destroyed }
}
