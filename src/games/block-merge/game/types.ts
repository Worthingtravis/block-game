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

/**
 * Compute the score threshold at which a given tile value gets removed.
 * Pattern: 500 * 4^level  (level 0 = value 2, level 1 = value 4, …)
 * This scales forever — every power-of-2 tile value has a removal threshold.
 */
export function getLevelUpThreshold(value: number): number {
  // value = 2 → level 0, value = 4 → level 1, value = 8 → level 2, …
  const level = Math.log2(value) - 1
  return 500 * Math.pow(4, level)
}

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
