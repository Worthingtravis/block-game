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
/**
 * Find the best merge group on the board. Scans all cells, returns the
 * largest group found (preferring the origin cell if it has a group).
 */
function findBestMerge(board: Board, preferOrigin?: Cell): { origin: Cell; group: Cell[] } | null {
  const visited = new Set<string>()
  let best: { origin: Cell; group: Cell[] } | null = null

  // Check preferred origin first
  if (preferOrigin && board[preferOrigin.row]?.[preferOrigin.col] !== null) {
    const group = findMergeGroup(board, preferOrigin)
    if (group.length >= 2) return { origin: preferOrigin, group }
  }

  // Scan entire board for any merge opportunity
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r},${c}`
      if (visited.has(key) || board[r][c] === null) continue
      const group = findMergeGroup(board, { row: r, col: c })
      if (group.length >= 2) {
        for (const cell of group) visited.add(`${cell.row},${cell.col}`)
        if (!best || group.length > best.group.length) {
          best = { origin: { row: r, col: c }, group }
        }
      }
    }
  }

  return best
}

export function resolveChains(
  board: Board,
  initialOrigin: Cell
): { board: Board; merges: MergeResult[] } {
  let currentBoard = board.map(row => [...row])
  const merges: MergeResult[] = []
  let chainDepth = 0
  let preferOrigin: Cell | undefined = { ...initialOrigin }
  const MAX_CHAINS = 20

  while (chainDepth < MAX_CHAINS) {
    const found = findBestMerge(currentBoard, preferOrigin)
    if (!found) break

    const { origin, group } = found
    const currentValue = currentBoard[origin.row][origin.col] as MergeValue
    const valueIndex = MERGE_VALUES.indexOf(currentValue)
    if (valueIndex === -1 || valueIndex >= MERGE_VALUES.length - 1) break

    const levelsUp = Math.min(group.length - 1, MERGE_VALUES.length - 1 - valueIndex)
    if (levelsUp < 1) break
    const nextValue = MERGE_VALUES[valueIndex + levelsUp]

    const mergedCells = group.filter(
      c => !(c.row === origin.row && c.col === origin.col)
    )

    merges.push({
      mergedCells,
      resultCell: { row: origin.row, col: origin.col },
      sourceValue: currentValue,
      resultValue: nextValue,
      chainDepth,
    })

    // Apply the merge
    let nextBoard = currentBoard.map(row => [...row])
    for (const cell of group) {
      nextBoard[cell.row][cell.col] = null
    }
    nextBoard[origin.row][origin.col] = nextValue

    // Apply gravity
    nextBoard = applyGravity(nextBoard)

    // Track where the result ended up after gravity
    let newOriginRow = origin.row
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      if (nextBoard[r][origin.col] === nextValue) {
        newOriginRow = r
        break
      }
    }
    preferOrigin = { row: newOriginRow, col: origin.col }

    currentBoard = nextBoard
    chainDepth++

    // Stop if we've reached the max value
    if (nextValue === 1024) break
  }

  return { board: currentBoard, merges }
}

/**
 * Apply gravity — blocks fall down to fill empty cells below them.
 */
export function applyGravity(board: Board): Board {
  const newBoard = board.map(row => [...row])
  for (let col = 0; col < BOARD_SIZE; col++) {
    let writeRow = BOARD_SIZE - 1
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      if (newBoard[row][col] !== null) {
        const val = newBoard[row][col]
        if (row !== writeRow) {
          newBoard[writeRow][col] = val
          newBoard[row][col] = null
        }
        writeRow--
      }
    }
  }
  return newBoard
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
 * Generate next block value. The minimum offered value gradually increases
 * as the player's score rises, phasing out lower values over time.
 *
 * Score thresholds for minimum value increases:
 * 0-199: 2s and 4s (70/30)
 * 200-499: 2s become rarer (50/50), 4s common
 * 500-999: mostly 4s (30/70), occasional 2
 * 1000-1999: 4s and 8s, no more 2s
 * 2000+: 4s, 8s, occasional 16
 */
export function generateNextValue(score: number): MergeValue {
  const rand = Math.random()

  if (score >= 2000) {
    if (rand < 0.15) return 16
    if (rand < 0.55) return 8
    return 4
  }
  if (score >= 1000) {
    if (rand < 0.3) return 8
    return 4
  }
  if (score >= 500) {
    if (rand < 0.3) return 2
    return 4
  }
  if (score >= 200) {
    if (rand < 0.5) return 2
    return 4
  }
  if (rand < 0.7) return 2
  return 4
}
