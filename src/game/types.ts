export const BOARD_SIZE = 10

export const BLOCK_COLORS = ['purple', 'orange', 'yellow', 'green', 'gray', 'blue', 'pink'] as const
export type BlockColor = (typeof BLOCK_COLORS)[number]

export type ShapeType =
  | 'single'
  | 'line2h' | 'line2v'
  | 'line3h' | 'line3v'
  | 'line4h' | 'line4v'
  | 'line5h' | 'line5v'
  | 'square2' | 'square3'
  | 'L1' | 'L2' | 'L3' | 'L4'
  | 'T1' | 'T2' | 'T3' | 'T4'
  | 'Z1' | 'Z2' | 'S1' | 'S2'

export type Cell = { row: number; col: number }

export type Piece = {
  id: string
  shape: ShapeType
  color: BlockColor
  cells: readonly Cell[]
}

export type Board = (BlockColor | null)[][]

export type GameState = {
  board: Board
  pieces: [Piece | null, Piece | null, Piece | null]
  score: number
  highScore: number
  comboMultiplier: number
  gameOver: boolean
}

export type DragState = {
  draggedPieceIndex: number | null
  hoverPosition: Cell | null
  placementValidity: boolean | null
}

export type ClearResult = {
  clearedRows: number[]
  clearedCols: number[]
  clearedCells: Cell[]
  linesCleared: number
}

export type GameAction =
  | { type: 'PLACE_PIECE'; pieceIndex: number; position: Cell }
  | { type: 'NEW_GAME' }
