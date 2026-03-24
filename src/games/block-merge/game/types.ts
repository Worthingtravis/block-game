export const BOARD_SIZE = 5

export type Cell = { row: number; col: number }
export type Board = (number | null)[][]

export type MergeResult = {
  /** Cells consumed by the merge (excludes the result cell). */
  mergedCells: Cell[]
  resultCell: Cell
  sourceValue: number
  resultValue: number
  /** Total cells in the merge group (mergedCells.length + 1). */
  groupSize: number
}

export type Phase = 'idle' | 'dropping' | 'merging' | 'gravity' | 'levelup'

/** Score thresholds where a value gets removed from the game. */
export const LEVEL_UP_THRESHOLDS: [number, number][] = [
  [500, 2],    // At 500 points, remove all 2s
  [2000, 4],   // At 2000 points, remove all 4s
  [8000, 8],   // At 8000 points, remove all 8s
]

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
  /** The value being removed during a level-up event */
  levelUpRemoved: number | null
  /** Minimum block value (values below this have been eliminated) */
  minValue: number
}

export type GameAction =
  | { type: 'PLACE_BLOCK'; col: number }
  | { type: 'STEP' }
  | { type: 'NEW_GAME' }
  | { type: 'LOAD_STATE'; state: GameState }
