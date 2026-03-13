import { describe, it, expect } from 'vitest'
import { gameReducer, createInitialState } from '../useGameState'
import type { GameState } from '../../game/types'
import { BOARD_SIZE } from '../../game/types'

describe('createInitialState', () => {
  it('creates initial state with empty board and 3 pieces', () => {
    const state = createInitialState()
    expect(state.board).toHaveLength(BOARD_SIZE)
    expect(state.pieces.filter(p => p !== null)).toHaveLength(3)
    expect(state.score).toBe(0)
    expect(state.comboMultiplier).toBe(1)
    expect(state.gameOver).toBe(false)
    expect(state.lastClear).toBeNull()
  })
})

describe('gameReducer PLACE_PIECE', () => {
  it('stamps piece on board and adds placement score', () => {
    const state = createInitialState()
    const piece = state.pieces[0]!
    const action = { type: 'PLACE_PIECE' as const, pieceIndex: 0, position: { row: 0, col: 0 } }
    const next = gameReducer(state, action)
    expect(next.pieces[0]).toBeNull()
    expect(next.score).toBeGreaterThanOrEqual(piece.cells.length)
    const filledCells = next.board.flat().filter(c => c !== null)
    expect(filledCells.length).toBeGreaterThanOrEqual(piece.cells.length)
  })

  it('generates new pieces when all 3 are placed', () => {
    let state = createInitialState()
    // Place each piece in its own column band to avoid overlap
    for (let i = 0; i < 3; i++) {
      const piece = state.pieces[i]!
      const maxRow = Math.max(...piece.cells.map(c => c.row))
      const maxCol = Math.max(...piece.cells.map(c => c.col))
      // Find a valid position: stack vertically, offset by column
      let placed = false
      for (let row = 0; row <= BOARD_SIZE - 1 - maxRow && !placed; row++) {
        for (let col = 0; col <= BOARD_SIZE - 1 - maxCol && !placed; col++) {
          const next = gameReducer(state, { type: 'PLACE_PIECE', pieceIndex: i, position: { row, col } })
          if (next !== state) { state = next; placed = true }
        }
      }
      expect(placed).toBe(true)
    }
    const nonNull = state.pieces.filter(p => p !== null)
    expect(nonNull.length).toBe(3)
  })

  it('resets combo when no lines are cleared', () => {
    let state = createInitialState()
    state = { ...state, comboMultiplier: 5 }
    const next = gameReducer(state, {
      type: 'PLACE_PIECE',
      pieceIndex: 0,
      position: { row: 0, col: 0 },
    })
    expect(next.comboMultiplier).toBe(1)
  })
})

describe('gameReducer NEW_GAME', () => {
  it('resets state but preserves high score', () => {
    const state: GameState = {
      board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill('blue')),
      pieces: [null, null, null],
      score: 500,
      highScore: 500,
      comboMultiplier: 3,
      gameOver: true,
      lastClear: null,
    }
    const next = gameReducer(state, { type: 'NEW_GAME' })
    expect(next.score).toBe(0)
    expect(next.highScore).toBe(500)
    expect(next.comboMultiplier).toBe(1)
    expect(next.gameOver).toBe(false)
    expect(next.pieces.filter(p => p !== null)).toHaveLength(3)
    expect(next.board.flat().every(c => c === null)).toBe(true)
  })
})
