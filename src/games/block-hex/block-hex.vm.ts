import type { HexColor, Phase, Board, Tile, MatchResult } from './game/types'
import type { Settings } from '../../shared/useSettings'

export type { MatchResult }

/** Gemstone color palette — high contrast between face and edge for visible depth */
export const HEX_COLORS: Record<HexColor, { face: string; edge: string; border: string; glow: string }> = {
  blue:   { face: '#4C9EFF', edge: '#1A4F8A', border: '#7AB8FF', glow: 'rgba(76, 158, 255, 0.5)' },
  red:    { face: '#FF4757', edge: '#8B1A1A', border: '#FF6B7A', glow: 'rgba(255, 71, 87, 0.5)' },
  yellow: { face: '#FFD32A', edge: '#8A7200', border: '#FFE066', glow: 'rgba(255, 211, 42, 0.5)' },
  green:  { face: '#2ED573', edge: '#0E5C2E', border: '#5AE896', glow: 'rgba(46, 213, 115, 0.5)' },
  purple: { face: '#A55EEA', edge: '#4A1A7A', border: '#C184F0', glow: 'rgba(165, 94, 234, 0.5)' },
}

/** Pre-computed cell data for rendering */
export type HexCellVM = {
  index: number
  row: number
  col: number
  /** Position in hex-widths from left */
  x: number
  /** Position in row-heights from top */
  y: number
  /** Color layers bottom-to-top, empty = [] */
  stack: HexColor[]
  /** Whether this cell is currently animating a match */
  isMatching: boolean
}

/** Pre-computed tile for the queue */
export type TileVM = {
  layers: HexColor[]
  isCurrent: boolean
}

/** Complete view model for the BlockHex game */
export type BlockHexVM = {
  // Board
  cells: HexCellVM[]
  phase: Phase
  lastMatch: MatchResult | null

  // Queue
  tiles: [TileVM, TileVM, TileVM]

  // Score
  score: number
  highScore: number
  comboMultiplier: number

  // Game state
  gameOver: boolean
  isNewBest: boolean
  totalClears: number

  // Actions
  onCellClick: (index: number) => void
  onBack: () => void
  onNewGame: () => void
  onOptionsOpen: () => void
  onOptionsClose: () => void
  onOptionsUpdate: (patch: Partial<Settings>) => void
  onRestart: () => void

  // UI state
  optionsOpen: boolean
  settings: Settings
}

// --- Layout constants ---

export const ROWS: number[][] = [
  [0, 1, 2],
  [3, 4, 5, 6],
  [7, 8, 9, 10, 11],
  [12, 13, 14, 15],
  [16, 17, 18],
]

/** Offset per row in hex-widths. Shorter rows push right. */
export const ROW_OFFSETS = [1, 0.5, 0, 0.5, 1]

// --- VM builders ---

export function buildCells(board: Board, lastMatch: MatchResult | null): HexCellVM[] {
  const matchingSet = new Set(lastMatch?.cellIndices ?? [])
  const cells: HexCellVM[] = []

  for (let rowIndex = 0; rowIndex < ROWS.length; rowIndex++) {
    const row = ROWS[rowIndex]
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellIndex = row[colIndex]
      cells.push({
        index: cellIndex,
        row: rowIndex,
        col: colIndex,
        x: colIndex + ROW_OFFSETS[rowIndex],
        y: rowIndex,
        stack: board[cellIndex] ?? [],
        isMatching: matchingSet.has(cellIndex),
      })
    }
  }

  return cells
}

export function buildTiles(queue: [Tile, Tile, Tile]): [TileVM, TileVM, TileVM] {
  return [
    { layers: queue[0], isCurrent: true },
    { layers: queue[1], isCurrent: false },
    { layers: queue[2], isCurrent: false },
  ]
}
