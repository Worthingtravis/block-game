import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameReducer, buildInitialState } from '../useGameState'
import type { GameState } from '../../game/types'
import { BOARD_SIZE } from '../../game/types'

// Mock persistence so tests do not touch localStorage
vi.mock('../../persistence', () => ({
  loadGame: vi.fn(() => null),
  loadHighScore: vi.fn(() => 0),
  saveHighScore: vi.fn(),
  saveGame: vi.fn(),
  hydrateState: vi.fn(),
}))

// Mock Claire AI so tests are deterministic
vi.mock('../../dialogue/claire-ai', () => ({
  selectNextMode: vi.fn(() => 'color-crush'),
  pickDialogue: vi.fn(() => 'test message'),
  updateMood: vi.fn((_state: unknown, event: string) => event === 'bad_move' ? 'annoyed' : 'happy'),
  getActionsForMode: vi.fn(() => 12),
  getDifficulty: vi.fn(() => ({ colorCount: 4, echoLength: 3, blitzSeconds: 30, minGroupSize: 3, obstacleChance: 0 })),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...buildInitialState(), ...overrides }
}

// ---------------------------------------------------------------------------
// buildInitialState
// ---------------------------------------------------------------------------

describe('buildInitialState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a 6x6 board', () => {
    const state = buildInitialState()
    expect(state.board).toHaveLength(BOARD_SIZE)
    state.board.forEach(row => expect(row).toHaveLength(BOARD_SIZE))
  })

  it('starts with color-crush mode', () => {
    const state = buildInitialState()
    expect(state.mode).toBe('color-crush')
  })

  it('starts with score 0', () => {
    const state = buildInitialState()
    expect(state.score).toBe(0)
  })

  it('starts with gameOver false', () => {
    const state = buildInitialState()
    expect(state.gameOver).toBe(false)
  })

  it('board cells have color (random board, not empty)', () => {
    const state = buildInitialState()
    const hasColor = state.board.flat().some(c => c.color !== null)
    expect(hasColor).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// NEW_GAME
// ---------------------------------------------------------------------------

describe('gameReducer NEW_GAME', () => {
  it('resets score and preserves highScore', () => {
    const state = makeState({ score: 999, highScore: 999, gameOver: true })
    const next = gameReducer(state, { type: 'NEW_GAME' })
    expect(next.score).toBe(0)
    expect(next.highScore).toBe(999)
  })

  it('resets gameOver to false', () => {
    const state = makeState({ gameOver: true })
    const next = gameReducer(state, { type: 'NEW_GAME' })
    expect(next.gameOver).toBe(false)
  })

  it('resets mode to color-crush', () => {
    const state = makeState({ mode: 'pattern-echo' })
    const next = gameReducer(state, { type: 'NEW_GAME' })
    expect(next.mode).toBe('color-crush')
  })

  it('sets modePhase to intro', () => {
    const state = makeState({ gameOver: true })
    const next = gameReducer(state, { type: 'NEW_GAME' })
    expect(next.modePhase).toBe('intro')
  })
})

// ---------------------------------------------------------------------------
// TAP_CELL — color crush
// ---------------------------------------------------------------------------

describe('gameReducer TAP_CELL (color-crush)', () => {
  it('does nothing when game is over', () => {
    const state = makeState({ gameOver: true, modePhase: 'active' })
    const next = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(next).toBe(state)
  })

  it('does nothing when modePhase is not active', () => {
    const state = makeState({ modePhase: 'intro' })
    const next = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(next).toBe(state)
  })

  it('bad move when group is smaller than 3 — resets streak, annoyed mood', () => {
    // Build a board where (0,0) is isolated (different colour from neighbours)
    const board = buildInitialState().board.map((row, r) =>
      row.map((cell, c) => ({
        ...cell,
        color: r === 0 && c === 0 ? 'rose' as const : 'sky' as const,
      }))
    )
    // Force no adjacent rose cells so group size = 1
    board[0][1] = { ...board[0][1], color: 'sky' }
    board[1][0] = { ...board[1][0], color: 'sky' }

    const state = makeState({ board, modePhase: 'active', streak: 5 })
    const next = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(next.streak).toBe(0)
    expect(next.claireMood).toBe('annoyed')
    expect(next.lastAction).toBe('bad_move')
  })

  it('good move when group >= 3 — increases score and decrements actionsRemaining', () => {
    // Build a board with a big connected group of the same colour at top-left
    const board = buildInitialState().board.map((row, r) =>
      row.map((cell, c) => ({
        ...cell,
        color: r < 2 && c < 3 ? 'rose' as const : 'sky' as const,
      }))
    )
    // 2 rows × 3 cols = 6 cells of 'rose' — well above threshold
    const state = makeState({ board, modePhase: 'active', actionsRemaining: 10, score: 0 })
    const next = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(next.score).toBeGreaterThan(0)
    expect(next.actionsRemaining).toBe(9)
    expect(next.lastAction).toBe('good_move')
  })

  it('transitions to outro when actionsRemaining hits 0', () => {
    const board = buildInitialState().board.map((row, r) =>
      row.map((cell, c) => ({
        ...cell,
        color: r < 2 && c < 3 ? 'mint' as const : 'violet' as const,
      }))
    )
    const state = makeState({ board, modePhase: 'active', actionsRemaining: 1 })
    const next = gameReducer(state, { type: 'TAP_CELL', row: 0, col: 0 })
    expect(next.modePhase).toBe('outro')
    expect(next.actionsRemaining).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// STEP
// ---------------------------------------------------------------------------

describe('gameReducer STEP', () => {
  it('advances intro → active', () => {
    const state = makeState({ modePhase: 'intro' })
    const next = gameReducer(state, { type: 'STEP' })
    expect(next.modePhase).toBe('active')
  })

  it('advances outro → transitioning', () => {
    const state = makeState({ modePhase: 'outro' })
    const next = gameReducer(state, { type: 'STEP' })
    expect(next.modePhase).toBe('transitioning')
  })

  it('advances transitioning → into a new START_MODE (lands on intro)', () => {
    const state = makeState({ modePhase: 'transitioning', modesCompleted: 0 })
    const next = gameReducer(state, { type: 'STEP' })
    // START_MODE sets modePhase to 'intro'
    expect(next.modePhase).toBe('intro')
    expect(next.modesCompleted).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// START_MODE
// ---------------------------------------------------------------------------

describe('gameReducer START_MODE', () => {
  it('sets mode and resets per-mode fields', () => {
    const state = makeState({ streak: 10, actionsRemaining: 2, echoErrors: 3 })
    const next = gameReducer(state, { type: 'START_MODE', mode: 'color-crush' })
    expect(next.mode).toBe('color-crush')
    expect(next.modePhase).toBe('intro')
    expect(next.actionsRemaining).toBe(12)
    expect(next.echoErrors).toBe(0)
    expect(next.modesCompleted).toBe(state.modesCompleted + 1)
  })
})

// ---------------------------------------------------------------------------
// TRANSITION_DONE
// ---------------------------------------------------------------------------

describe('gameReducer TRANSITION_DONE', () => {
  it('sets modePhase to active and clears message', () => {
    const state = makeState({ modePhase: 'transitioning', claireMessage: 'hello' })
    const next = gameReducer(state, { type: 'TRANSITION_DONE' })
    expect(next.modePhase).toBe('active')
    expect(next.claireMessage).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// IDLE_TICK
// ---------------------------------------------------------------------------

describe('gameReducer IDLE_TICK', () => {
  it('sets annoyed mood and idle message when active', () => {
    const state = makeState({ modePhase: 'active', claireMood: 'happy' })
    const next = gameReducer(state, { type: 'IDLE_TICK' })
    expect(next.claireMood).toBe('annoyed')
    expect(next.claireMessage).toBeTruthy()
    expect(next.lastAction).toBe('idle')
  })

  it('ignores idle tick when not in active phase', () => {
    const state = makeState({ modePhase: 'intro' })
    const next = gameReducer(state, { type: 'IDLE_TICK' })
    expect(next).toBe(state)
  })
})
