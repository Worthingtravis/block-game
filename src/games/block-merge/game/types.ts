export const BOARD_SIZE = 5

export type Cell = { row: number; col: number }
export type Board = (number | null)[][]

export type MergeResult = {
  mergedCells: Cell[]
  resultCell: Cell
  sourceValue: number
  resultValue: number
}

export type Phase = 'idle' | 'dropping' | 'merging' | 'gravity'

export type GameState = {
  board: Board
  queue: [number, number, number]
  score: number
  highScore: number
  highestTile: number
  totalMerges: number
  gameOver: boolean
  phase: Phase
  currentMerge: MergeResult | null
  chainStep: number
  dropCell: Cell | null
}

export type GameAction =
  | { type: 'PLACE_BLOCK'; col: number }
  | { type: 'STEP' }
  | { type: 'NEW_GAME' }
  | { type: 'LOAD_STATE'; state: GameState }
