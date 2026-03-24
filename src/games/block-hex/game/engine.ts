import { HEX_COLORS } from './types'
import type { Board, HexColor, Tile } from './types'

export function createEmptyBoard(): Board {
  return Array.from({ length: 19 }, () => [])
}

// 19-cell hex grid adjacency list
// Row 0: cells 0,1,2       (3 cells)
// Row 1: cells 3,4,5,6     (4 cells, offset left)
// Row 2: cells 7,8,9,10,11 (5 cells)
// Row 3: cells 12,13,14,15 (4 cells, offset left)
// Row 4: cells 16,17,18    (3 cells)
export const ADJACENCY: number[][] = [
  [1, 3, 4],           // 0
  [0, 2, 4, 5],        // 1
  [1, 5, 6],           // 2
  [0, 4, 7, 8],        // 3
  [0, 1, 3, 5, 8, 9],  // 4
  [1, 2, 4, 6, 9, 10], // 5
  [2, 5, 10, 11],      // 6
  [3, 8, 12],          // 7
  [3, 4, 7, 9, 12, 13], // 8
  [4, 5, 8, 10, 13, 14], // 9
  [5, 6, 9, 11, 14, 15], // 10
  [6, 10, 15],          // 11
  [7, 8, 13, 16],       // 12
  [8, 9, 12, 14, 16, 17], // 13
  [9, 10, 13, 15, 17, 18], // 14
  [10, 11, 14, 18],     // 15
  [12, 13, 17],         // 16
  [13, 14, 16, 18],     // 17
  [14, 15, 17],         // 18
]

export function getTopColor(board: Board, cellIndex: number): HexColor | null {
  const stack = board[cellIndex]
  if (stack.length === 0) return null
  return stack[stack.length - 1]
}

export function findMatches(board: Board): [number, number][] {
  const pairs: [number, number][] = []
  for (let i = 0; i < board.length; i++) {
    const topI = getTopColor(board, i)
    if (topI === null) continue
    for (const j of ADJACENCY[i]) {
      if (j <= i) continue // avoid duplicates
      const topJ = getTopColor(board, j)
      if (topJ === topI) {
        pairs.push([i, j])
      }
    }
  }
  return pairs
}

export function applyMatches(board: Board, pairs: [number, number][]): { board: Board; cleared: number } {
  // Deduplicate cells that appear in multiple pairs
  const cellSet = new Set<number>()
  for (const [a, b] of pairs) {
    cellSet.add(a)
    cellSet.add(b)
  }

  const newBoard = board.map(stack => [...stack])
  for (const cellIndex of cellSet) {
    newBoard[cellIndex].pop()
  }

  return { board: newBoard, cleared: cellSet.size }
}

export function checkGameOver(board: Board): boolean {
  // Not game over if any cell is empty
  for (let i = 0; i < board.length; i++) {
    if (board[i].length === 0) return false
  }
  // Not game over if there are adjacent top-color matches
  const matches = findMatches(board)
  return matches.length === 0
}

export function generateTile(): Tile {
  const layerCount = Math.floor(Math.random() * 3) + 1 // 1-3
  const tile: HexColor[] = []
  for (let i = 0; i < layerCount; i++) {
    tile.push(HEX_COLORS[Math.floor(Math.random() * HEX_COLORS.length)])
  }
  return tile
}

export function placeTile(board: Board, cellIndex: number, tile: Tile): Board | null {
  if (board[cellIndex].length > 0) return null
  const newBoard = board.map(stack => [...stack])
  newBoard[cellIndex] = [...tile]
  return newBoard
}
