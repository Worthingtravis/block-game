import type { Board, Cell, MergeResult, MergeValue } from './types'
import { BOARD_SIZE, MERGE_VALUES } from './types'

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  )
}

const ORTHOGONAL_DIRS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]

/**
 * BFS flood-fill: find all orthogonally-adjacent cells with the same value as origin.
 * Returns the group (including origin) only if 2+ cells share the value; otherwise returns [].
 */
export function findMergeGroup(board: Board, origin: Cell): Cell[] {
  const value = board[origin.row][origin.col]
  if (value === null) return []

  const visited = new Set<string>()
  const queue: Cell[] = [origin]
  const group: Cell[] = []

  visited.add(`${origin.row},${origin.col}`)

  while (queue.length > 0) {
    const current = queue.shift()!
    group.push(current)

    for (const dir of ORTHOGONAL_DIRS) {
      const nr = current.row + dir.row
      const nc = current.col + dir.col
      const key = `${nr},${nc}`
      if (
        nr >= 0 && nr < BOARD_SIZE &&
        nc >= 0 && nc < BOARD_SIZE &&
        !visited.has(key) &&
        board[nr][nc] === value
      ) {
        visited.add(key)
        queue.push({ row: nr, col: nc })
      }
    }
  }

  return group.length >= 2 ? group : []
}

/**
 * After placing a value at origin, find merge group at origin. If 2+, remove all,
 * place value*2 at origin. Repeat at origin with new value (chain reaction).
 * Loop until no more merges or value exceeds 1024.
 */
export function resolveChains(
  board: Board,
  origin: Cell
): { board: Board; merges: MergeResult[] } {
  let currentBoard = board.map(row => [...row])
  const merges: MergeResult[] = []
  let chainDepth = 0

  while (true) {
    const group = findMergeGroup(currentBoard, origin)
    if (group.length < 2) break

    const currentValue = currentBoard[origin.row][origin.col] as MergeValue
    const valueIndex = MERGE_VALUES.indexOf(currentValue)
    if (valueIndex === -1 || valueIndex >= MERGE_VALUES.length - 1) break

    const nextValue = MERGE_VALUES[valueIndex + 1]

    // Record which cells were merged (all except the result cell)
    const mergedCells = group.filter(
      c => !(c.row === origin.row && c.col === origin.col)
    )

    merges.push({
      mergedCells,
      resultCell: { row: origin.row, col: origin.col },
      resultValue: nextValue,
      chainDepth,
    })

    // Apply the merge: clear all group cells, place new value at origin
    const nextBoard = currentBoard.map(row => [...row])
    for (const cell of group) {
      nextBoard[cell.row][cell.col] = null
    }
    nextBoard[origin.row][origin.col] = nextValue

    currentBoard = nextBoard
    chainDepth++

    // Stop if we've reached the max value
    if (nextValue === 1024) break
  }

  return { board: currentBoard, merges }
}

/**
 * Returns true when every cell is occupied AND no two orthogonally-adjacent
 * cells share the same value (meaning no merges are possible).
 */
export function checkGameOver(board: Board): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) return false
    }
  }

  // Board is full — check if any adjacent pair can merge
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const value = board[row][col]
      for (const dir of ORTHOGONAL_DIRS) {
        const nr = row + dir.row
        const nc = col + dir.col
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (board[nr][nc] === value) return false
        }
      }
    }
  }

  return true
}

/**
 * Weighted random: mostly 2s (70%), some 4s (30%), shifting to 60/40 at high scores.
 */
export function generateNextValue(score: number): MergeValue {
  const highScore = score >= 1000
  const twoProbability = highScore ? 0.6 : 0.7
  return Math.random() < twoProbability ? 2 : 4
}
