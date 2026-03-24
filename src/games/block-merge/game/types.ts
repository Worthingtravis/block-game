export const BOARD_SIZE = 5
export const MERGE_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192] as const
export type MergeValue = (typeof MERGE_VALUES)[number]

export const VALUE_COLORS: Record<MergeValue, string> = {
  2: '#4a90d9', 4: '#2bbcb3', 8: '#4caf50', 16: '#8bc34a',
  32: '#ffdd44', 64: '#ff9800', 128: '#f44336', 256: '#e91e90',
  512: '#9c27b0', 1024: '#5c6bc0',
  2048: '#d4af37', 4096: '#ff4081', 8192: '#00e5ff',
}

export type Cell = { row: number; col: number }
export type Board = (MergeValue | null)[][]

export type MergeResult = {
  mergedCells: Cell[]
  resultCell: Cell
  sourceValue: MergeValue
  resultValue: MergeValue
}

/** Visual phase the game is in */
export type Phase = 'idle' | 'dropping' | 'merging' | 'gravity'

export type GameState = {
  board: Board
  queue: [MergeValue, MergeValue, MergeValue]
  score: number
  highScore: number
  highestTile: MergeValue
  totalMerges: number
  gameOver: boolean
  phase: Phase
  /** The merge that just happened (for animation/audio) */
  currentMerge: MergeResult | null
  /** Where the last block landed */
  dropCell: Cell | null
}

export type GameAction =
  | { type: 'PLACE_BLOCK'; col: number }
  | { type: 'STEP' }
  | { type: 'NEW_GAME' }
  | { type: 'LOAD_STATE'; state: GameState }
