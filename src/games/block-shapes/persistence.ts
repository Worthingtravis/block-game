import type { Cell, Piece, ShapeType, GameState } from './game/types'
import { createEmptyBoard } from './game/engine'
import { gameReducer } from './hooks/useGameState'
import { SHAPE_DEFINITIONS } from './game/pieces'
import type { BlockColor } from './game/types'

export type GameStatus = 'in_progress' | 'game_over' | 'abandoned'

export type StoredPiece = { shape: ShapeType; color: BlockColor } | null

export type StoredMove = {
  move_number: number
  piece_index: number
  position_row: number
  position_col: number
  next_pieces: StoredPiece[] | null
}

export type StoredGame = {
  id: string
  status: GameStatus
  score: number
  initial_pieces: StoredPiece[]
  moves: StoredMove[]
}

function pieceFromStored(sp: StoredPiece): Piece | null {
  if (!sp) return null
  return {
    id: crypto.randomUUID(),
    shape: sp.shape,
    color: sp.color,
    cells: SHAPE_DEFINITIONS[sp.shape],
  }
}

export function pieceToStored(p: Piece | null): StoredPiece {
  if (!p) return null
  return { shape: p.shape, color: p.color }
}

export function createStoredGame(pieces: (Piece | null)[], score = 0): StoredGame {
  return {
    id: crypto.randomUUID(),
    status: 'in_progress',
    score,
    initial_pieces: pieces.map(pieceToStored),
    moves: [],
  }
}

export function replayGame(game: StoredGame, highScore: number): GameState {
  const initialPieces = game.initial_pieces.map(pieceFromStored) as [Piece | null, Piece | null, Piece | null]

  let state: GameState = {
    board: createEmptyBoard(),
    pieces: initialPieces,
    score: 0,
    highScore,
    comboMultiplier: 1,
    gameOver: false,
    lastClear: null,
  }

  const sorted = [...game.moves].sort((a, b) => a.move_number - b.move_number)

  for (const move of sorted) {
    const position: Cell = { row: move.position_row, col: move.position_col }
    state = gameReducer(state, { type: 'PLACE_PIECE', pieceIndex: move.piece_index, position })

    // Override random piece sets with the stored ones for deterministic replay
    if (move.next_pieces) {
      const pieces = move.next_pieces.map(pieceFromStored) as [Piece | null, Piece | null, Piece | null]
      state = { ...state, pieces }
    }
  }

  return state
}

const LOCAL_GAME_KEY = 'block-shapes-current-game'

export function saveGameLocally(game: StoredGame): void {
  try { localStorage.setItem(LOCAL_GAME_KEY, JSON.stringify(game)) } catch { /* */ }
}

export function loadGameLocally(): StoredGame | null {
  try {
    const stored = localStorage.getItem(LOCAL_GAME_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch { return null }
}

export function clearLocalGame(): void {
  try { localStorage.removeItem(LOCAL_GAME_KEY) } catch { /* */ }
}
