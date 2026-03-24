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

// Difficulty tiers — start with line-filling pieces, add tricky shapes later
const SHAPE_TIERS: { minScore: number; shapes: ShapeType[] }[] = [
  { minScore: 0,   shapes: [
    'line2h', 'line2v', 'line3h', 'line3v', 'line4h', 'line4v', 'line5h', 'line5v',
    'square2', 'square3',
    'L1', 'L2', 'L3', 'L4',
  ] },
  { minScore: 100, shapes: ['T1', 'T2', 'T3', 'T4', 'single'] },
  { minScore: 250, shapes: ['Z1', 'Z2', 'S1', 'S2'] },
]

function getAvailableShapes(score: number): ShapeType[] {
  const available: ShapeType[] = []
  for (const tier of SHAPE_TIERS) {
    if (score >= tier.minScore) available.push(...tier.shapes)
  }
  return available
}

function randomShape(score?: number): ShapeType {
  const pool = score != null ? getAvailableShapes(score) : ALL_SHAPES
  return pool[Math.floor(Math.random() * pool.length)]
}

export function generatePiece(score?: number): Piece {
  const shape = randomShape(score)
  return {
    id: crypto.randomUUID(),
    shape,
    color: SHAPE_COLOR_MAP[shape],
    cells: SHAPE_DEFINITIONS[shape],
  }
}

export function generatePieceSet(score?: number): [Piece, Piece, Piece] {
  return [generatePiece(score), generatePiece(score), generatePiece(score)]
}

const MAX_FAIR_ATTEMPTS = 50

export function generateFairPieceSet(board: Board, score?: number): [Piece, Piece, Piece] {
  let last = generatePieceSet(score)
  for (let i = 0; i < MAX_FAIR_ATTEMPTS; i++) {
    const candidate = i === 0 ? last : generatePieceSet(score)
    last = candidate
    if (canAllPiecesFit(board, [...candidate])) return candidate
  }
  return last
}
