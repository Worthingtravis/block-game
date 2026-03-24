export const HEX_COLORS = ['blue', 'red', 'yellow', 'green', 'purple'] as const
export type HexColor = (typeof HEX_COLORS)[number]

// 19-cell hex grid: rows of 3-4-5-4-3
export const CELL_COUNT = 19

// Each cell holds a stack of colors (top = last element). Empty = []
export type CellStack = HexColor[]
export type Board = CellStack[]  // length 19

// A tile the player places — has 1-3 color layers
export type Tile = HexColor[]  // length 1-3, first = bottom, last = top

export type Phase = 'idle' | 'placing' | 'matching' | 'chain'

export type MatchResult = {
  cellIndices: number[]  // cells that lost their top layer
  color: HexColor        // the color that matched
  chainDepth: number
}

export type GameState = {
  board: Board
  queue: [Tile, Tile, Tile]
  score: number
  highScore: number
  totalClears: number
  gameOver: boolean
  phase: Phase
  lastMatch: MatchResult | null
  chainStep: number
}

export type GameAction =
  | { type: 'PLACE_TILE'; cellIndex: number }
  | { type: 'STEP' }
  | { type: 'NEW_GAME' }
  | { type: 'LOAD_STATE'; state: GameState }
