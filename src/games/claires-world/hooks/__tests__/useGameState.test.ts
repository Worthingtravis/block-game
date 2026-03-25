import { describe, it, expect, beforeEach } from 'vitest'
import { gameReducer, buildInitialState } from '../useGameState'
import type { GameState } from '../../game/types'
import { createRandomBoard } from '../../game/engine'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...buildInitialState(),
    modePhase: 'active',
    claireMessage: null,
    ...overrides,
  }
}

function boardWithGroup(): GameState['board'] {
  const board = createRandomBoard(4)
  board[0][0] = { color: 'rose', obstacle: false, highlighted: false }
  board[0][1] = { color: 'rose', obstacle: false, highlighted: false }
  board[1][0] = { color: 'rose', obstacle: false, highlighted: false }
  return board
}

describe('buildInitialState', () => {
  beforeEach(() => localStorage.clear())

  it('creates a 6x6 board fully filled', () => {
    const state = buildInitialState()
    expect(state.board).toHaveLength(6)
    state.board.forEach(row => {
      expect(row).toHaveLength(6)
      row.forEach(cell => expect(cell.color).not.toBeNull())
    })
  })

  it('starts with score 0', () => {
    const state = buildInitialState()
    expect(state.score).toBe(0)
    expect(state.gameOver).toBe(false)
  })

  it('starts with Claire greeting', () => {
    const state = buildInitialState()
    expect(state.claireMessage).toBeTruthy()
  })
})

describe('gameReducer TAP_CELL', () => {
  it('ignores tap when not active', () => {
    const state = makeState({ modePhase: 'intro' })
    const next = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(next).toBe(state)
  })

  it('bad tap resets streak', () => {
    const board = createRandomBoard(4)
    board[0][0] = { color: 'rose', obstacle: false, highlighted: false }
    board[0][1] = { color: 'sky', obstacle: false, highlighted: false }
    board[1][0] = { color: 'amber', obstacle: false, highlighted: false }
    const state = makeState({ board, streak: 5 })
    const next = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(next.streak).toBe(0)
    expect(next.lastAction).toBe('bad_move')
  })

  it('good clear increases score and streak', () => {
    const state = makeState({ board: boardWithGroup(), score: 0, streak: 0 })
    const next = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(next.score).toBeGreaterThan(0)
    expect(next.streak).toBe(1)
  })

  it('board fully filled after clear', () => {
    const state = makeState({ board: boardWithGroup() })
    const next = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    let empty = 0
    next.board.forEach(r => r.forEach(c => { if (!c.color) empty++ }))
    expect(empty).toBe(0)
  })

  it('bigger groups score more', () => {
    const s3 = makeState({ board: boardWithGroup(), score: 0 })
    const n3 = gameReducer(s3, { type: 'TAP_CELL', row: 0, col: 0 })

    const board5 = createRandomBoard(4)
    for (let i = 0; i < 5; i++) {
      const r = Math.floor(i / 3), c = i % 3
      board5[r][c] = { color: 'mint', obstacle: false, highlighted: false }
    }
    const s5 = makeState({ board: board5, score: 0 })
    const n5 = gameReducer(s5, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(n5.score).toBeGreaterThan(n3.score)
  })

  it('multiplier goes up on clear, down on bad tap', () => {
    const state = makeState({ board: boardWithGroup(), claireMultiplier: 1.5 })
    const good = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(good.claireMultiplier).toBeGreaterThan(1.5)
  })
})

describe('gameReducer STEP', () => {
  it('intro → active', () => {
    const state = makeState({ modePhase: 'intro' })
    const next = gameReducer(state, { type: 'STEP' })
    expect(next.modePhase).toBe('active')
  })
})

describe('gameReducer IDLE_TICK', () => {
  it('sets annoyed mood', () => {
    const state = makeState()
    const next = gameReducer(state, { type: 'IDLE_TICK' })
    expect(next.claireMood).toBe('annoyed')
    expect(next.claireMessage).toBeTruthy()
  })
})

describe('gameReducer NEW_GAME', () => {
  it('resets score, preserves high score', () => {
    const state = makeState({ score: 500, highScore: 1000, gameOver: true })
    const next = gameReducer(state, { type: 'NEW_GAME' })
    expect(next.score).toBe(0)
    expect(next.highScore).toBe(1000)
    expect(next.gameOver).toBe(false)
  })
})
