import type { Board, Cell, Piece, ShapeType, BlockColor } from './types'
import { canAllPiecesFit } from './engine'

export const SHAPE_DEFINITIONS: Record<ShapeType, readonly Cell[]> = {
  single: [{ row: 0, col: 0 }],

  line2h: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  line3h: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
  line4h: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
  line5h: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }],

  line2v: [{ row: 0, col: 0 }, { row: 1, col: 0 }],
  line3v: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  line4v: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }],
  line5v: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }, { row: 4, col: 0 }],

  square2: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
  ],
  square3: [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
  ],

  L1: [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 2, col: 0 }, { row: 2, col: 1 },
  ],
  L2: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 2, col: 0 },
  ],
  L3: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
                         { row: 1, col: 1 },
                         { row: 2, col: 1 },
  ],
  L4: [
                         { row: 0, col: 1 },
                         { row: 1, col: 1 },
    { row: 2, col: 0 }, { row: 2, col: 1 },
  ],

  T1: [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
                         { row: 1, col: 1 },
  ],
  T2: [
    { row: 0, col: 0 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
    { row: 2, col: 0 },
  ],
  T3: [
                         { row: 0, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
  ],
  T4: [
                         { row: 0, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
                         { row: 2, col: 1 },
  ],

  Z1: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
                         { row: 1, col: 1 }, { row: 1, col: 2 },
  ],
  Z2: [
                         { row: 0, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
    { row: 2, col: 0 },
  ],
  S1: [
                         { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
  ],
  S2: [
    { row: 0, col: 0 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
                         { row: 2, col: 1 },
  ],
}

const ALL_SHAPES = Object.keys(SHAPE_DEFINITIONS) as ShapeType[]

// Deterministic shape-to-color mapping — each shape family gets a unique color
const SHAPE_COLOR_MAP: Record<ShapeType, BlockColor> = {
  single: 'gray',
  line2h: 'teal', line2v: 'teal',
  line3h: 'blue', line3v: 'blue',
  line4h: 'indigo', line4v: 'indigo',
  line5h: 'pink', line5v: 'pink',
  square2: 'orange', square3: 'yellow',
  L1: 'green', L2: 'green', L3: 'green', L4: 'green',
  T1: 'purple', T2: 'purple', T3: 'purple', T4: 'purple',
  Z1: 'red', Z2: 'red',
  S1: 'lime', S2: 'lime',
}

function randomShape(): ShapeType {
  return ALL_SHAPES[Math.floor(Math.random() * ALL_SHAPES.length)]
}

export function generatePiece(): Piece {
  const shape = randomShape()
  return {
    id: crypto.randomUUID(),
    shape,
    color: SHAPE_COLOR_MAP[shape],
    cells: SHAPE_DEFINITIONS[shape],
  }
}

export function generatePieceSet(): [Piece, Piece, Piece] {
  return [generatePiece(), generatePiece(), generatePiece()]
}

const MAX_FAIR_ATTEMPTS = 50

export function generateFairPieceSet(board: Board): [Piece, Piece, Piece] {
  let last = generatePieceSet()
  for (let i = 0; i < MAX_FAIR_ATTEMPTS; i++) {
    const candidate = i === 0 ? last : generatePieceSet()
    last = candidate
    if (canAllPiecesFit(board, [...candidate])) return candidate
  }
  return last
}
