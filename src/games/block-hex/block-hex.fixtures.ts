import type { BlockHexVM } from './block-hex.vm'
import { buildCells } from './block-hex.vm'
import type { Board, HexColor } from './game/types'
import { createEmptyBoard } from './game/engine'

const noop = () => {}

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  soundVolume: 0.7,
  vibrationEnabled: true,
  theme: 'dark' as const,
}

function emptyBoard(): Board {
  return createEmptyBoard()
}

function fixture(overrides: Partial<BlockHexVM> = {}): BlockHexVM {
  return {
    cells: buildCells(emptyBoard(), null),
    phase: 'idle',
    lastMatch: null,
    tiles: [
      { layers: ['blue'], isCurrent: true },
      { layers: ['red', 'green'], isCurrent: false },
      { layers: ['yellow'], isCurrent: false },
    ],
    score: 0,
    highScore: 0,
    comboMultiplier: 1,
    gameOver: false,
    isNewBest: false,
    totalClears: 0,
    onCellClick: noop,
    onBack: noop,
    onNewGame: noop,
    onOptionsOpen: noop,
    onOptionsClose: noop,
    onOptionsUpdate: noop,
    onRestart: noop,
    optionsOpen: false,
    settings: DEFAULT_SETTINGS,
    ...overrides,
  }
}

// Board with some tiles placed
function boardWithTiles(): Board {
  const board = emptyBoard()
  board[1] = ['purple']
  board[4] = ['blue', 'red']
  board[5] = ['blue']
  board[9] = ['yellow', 'green', 'blue']
  board[10] = ['red']
  board[13] = ['green', 'purple']
  board[14] = ['yellow']
  board[17] = ['red', 'red']
  return board
}

function fullBoard(): Board {
  const colors: HexColor[] = ['blue', 'red', 'yellow', 'green', 'purple']
  const board = emptyBoard()
  for (let i = 0; i < 19; i++) {
    const c = colors[i % colors.length]
    board[i] = [c, colors[(i + 1) % colors.length]]
  }
  return board
}

// --- Fixtures ---

export const IDLE_EMPTY = fixture({})

export const IDLE_WITH_TILES = fixture({
  cells: buildCells(boardWithTiles(), null),
  score: 420,
  highScore: 1200,
})

export const IDLE_HIGH_COMBO = fixture({
  cells: buildCells(boardWithTiles(), null),
  score: 1850,
  highScore: 1850,
  comboMultiplier: 4,
})

export const MATCHING = fixture({
  cells: buildCells(boardWithTiles(), { cellIndices: [4, 5], color: 'blue', chainDepth: 0 }),
  phase: 'matching',
  score: 200,
})

export const CHAIN_REACTION = fixture({
  cells: buildCells(boardWithTiles(), { cellIndices: [9, 13, 14], color: 'yellow', chainDepth: 2 }),
  phase: 'chain',
  score: 800,
  comboMultiplier: 3,
})

export const DEEP_STACKS = fixture({
  cells: buildCells((() => {
    const board = emptyBoard()
    board[4] = ['blue', 'red', 'green', 'yellow', 'purple']
    board[9] = ['red', 'blue', 'red', 'blue']
    board[8] = ['green', 'green', 'green']
    board[13] = ['purple', 'yellow']
    return board
  })(), null),
  score: 600,
})

export const NEARLY_FULL = fixture({
  cells: buildCells(fullBoard(), null),
  score: 3200,
  highScore: 3200,
})

export const GAME_OVER = fixture({
  cells: buildCells(fullBoard(), null),
  score: 2800,
  highScore: 3200,
  gameOver: true,
  totalClears: 45,
})

export const GAME_OVER_NEW_BEST = fixture({
  cells: buildCells(fullBoard(), null),
  score: 4500,
  highScore: 4500,
  gameOver: true,
  isNewBest: true,
  totalClears: 62,
})

export const OPTIONS_OPEN = fixture({
  cells: buildCells(boardWithTiles(), null),
  score: 500,
  optionsOpen: true,
})

export const MULTI_LAYER_QUEUE = fixture({
  tiles: [
    { layers: ['blue', 'red', 'green'], isCurrent: true },
    { layers: ['purple', 'yellow'], isCurrent: false },
    { layers: ['red'], isCurrent: false },
  ],
})

export const ALL_FIXTURES: Record<string, BlockHexVM> = {
  'Idle — Empty Board': IDLE_EMPTY,
  'Idle — With Tiles': IDLE_WITH_TILES,
  'Idle — High Combo': IDLE_HIGH_COMBO,
  'Matching': MATCHING,
  'Chain Reaction': CHAIN_REACTION,
  'Deep Stacks': DEEP_STACKS,
  'Nearly Full': NEARLY_FULL,
  'Game Over': GAME_OVER,
  'Game Over — New Best': GAME_OVER_NEW_BEST,
  'Options Open': OPTIONS_OPEN,
  'Multi-Layer Queue': MULTI_LAYER_QUEUE,
}
