import type { GameState, Board, Piece, BlockColor } from './types'
import { BOARD_SIZE, BLOCK_COLORS } from './types'
import { SHAPE_DEFINITIONS } from './pieces'

// Compact encoding: board as string of color indices (0=null, 1-7=colors)
// Pieces as shape:color pairs. Whole thing is base64url in the hash.

const COLOR_TO_IDX: Record<string, number> = {}
BLOCK_COLORS.forEach((c, i) => { COLOR_TO_IDX[c] = i + 1 })

function encodeBoard(board: Board): string {
  return board.flat().map(c => c ? COLOR_TO_IDX[c].toString() : '0').join('')
}

function decodeBoard(s: string): Board {
  const board: Board = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: (BlockColor | null)[] = []
    for (let c = 0; c < BOARD_SIZE; c++) {
      const idx = parseInt(s[r * BOARD_SIZE + c])
      row.push(idx === 0 ? null : BLOCK_COLORS[idx - 1])
    }
    board.push(row)
  }
  return board
}

function encodePiece(p: Piece | null): string {
  if (!p) return '_'
  return `${p.shape}:${p.color}`
}

function decodePiece(s: string): Piece | null {
  if (s === '_') return null
  const [shape, color] = s.split(':') as [keyof typeof SHAPE_DEFINITIONS, BlockColor]
  if (!SHAPE_DEFINITIONS[shape]) return null
  return {
    id: crypto.randomUUID(),
    shape,
    color,
    cells: SHAPE_DEFINITIONS[shape],
  }
}

export function serializeState(state: GameState): string {
  const data = {
    b: encodeBoard(state.board),
    p: state.pieces.map(encodePiece),
    s: state.score,
    c: state.comboMultiplier,
  }
  return btoa(JSON.stringify(data))
}

export function deserializeState(hash: string): Partial<GameState> | null {
  try {
    const data = JSON.parse(atob(hash))
    const board = decodeBoard(data.b)
    const pieces = (data.p as string[]).map(decodePiece) as [Piece | null, Piece | null, Piece | null]
    return {
      board,
      pieces,
      score: data.s ?? 0,
      comboMultiplier: data.c ?? 1,
      gameOver: false,
      lastClear: null,
    }
  } catch {
    return null
  }
}

export function getStateFromUrl(): Partial<GameState> | null {
  const hash = window.location.hash.slice(1)
  if (!hash) return null
  return deserializeState(hash)
}

export function setStateToUrl(state: GameState): void {
  const serialized = serializeState(state)
  window.history.replaceState(null, '', `#${serialized}`)
}
