export const BOARD_SIZE = 5
export const MERGE_VALUES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024] as const
export type MergeValue = (typeof MERGE_VALUES)[number]

export const VALUE_COLORS: Record<MergeValue, string> = {
  2: '#4a90d9', 4: '#2bbcb3', 8: '#4caf50', 16: '#8bc34a',
  32: '#ffdd44', 64: '#ff9800', 128: '#f44336', 256: '#e91e90',
  512: '#9c27b0', 1024: '#5c6bc0',
}

export type Cell = { row: number; col: number }
export type Board = (MergeValue | null)[][]

export type MergeResult = {
  mergedCells: Cell[]
  resultCell: Cell
  sourceValue: MergeValue
  resultValue: MergeValue
  chainDepth: number
}

export type DropInfo = {
  col: number
  fromRow: number
  toRow: number
  value: MergeValue
}

export type GameState = {
  board: Board
  queue: [MergeValue, MergeValue, MergeValue]
  score: number
  highScore: number
  highestTile: MergeValue
  comboMultiplier: number
  totalMerges: number
  gameOver: boolean
  lastMerges: MergeResult[] | null
  lastDrop: DropInfo | null
}

export type GameAction =
  | { type: 'PLACE_BLOCK'; position: Cell }
  | { type: 'NEW_GAME' }
  | { type: 'LOAD_STATE'; state: GameState }
