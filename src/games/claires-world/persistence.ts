import type { GameState, Board, ClaireMode } from './game/types'
import { createRandomBoard, createEmptyBoard } from './game/engine'

const LOCAL_KEY = 'claires-world-current-game'
const HIGH_SCORE_KEY = 'claires-world-high-score'

// Fields saved to localStorage.
// modePhase is always resumed as 'active'.
// claireMessage and timerEndsAt are intentionally omitted.
type PersistedState = {
  board: Board
  mode: ClaireMode
  score: number
  modesCompleted: number
  streak: number
  claireMultiplier: number
  echoErrors: number
}

export function saveHighScore(score: number): void {
  try { localStorage.setItem(HIGH_SCORE_KEY, String(score)) } catch { /* */ }
}

export function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY)
    return stored ? parseInt(stored, 10) || 0 : 0
  } catch { return 0 }
}

export function saveGame(state: GameState): void {
  const persisted: PersistedState = {
    board: state.board,
    mode: state.mode,
    score: state.score,
    modesCompleted: state.modesCompleted,
    streak: state.streak,
    claireMultiplier: state.claireMultiplier,
    echoErrors: state.echoErrors,
  }
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(persisted)) } catch { /* */ }
}

export function loadGame(): PersistedState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch { return null }
}

export function clearGame(): void {
  try { localStorage.removeItem(LOCAL_KEY) } catch { /* */ }
}

// Build a partial GameState from persisted data, merging with defaults.
// modePhase is always set to 'active' on resume.
export function hydrateState(persisted: PersistedState, highScore: number): Partial<GameState> {
  return {
    board: persisted.board,
    mode: persisted.mode,
    modePhase: 'active',
    score: persisted.score,
    highScore,
    modesCompleted: persisted.modesCompleted,
    streak: persisted.streak,
    claireMultiplier: persisted.claireMultiplier,
    echoErrors: persisted.echoErrors,
    // Derived defaults — not persisted
    actionsRemaining: actionsForMode(persisted.mode, persisted.modesCompleted),
    gameOver: false,
    claireMood: 'neutral',
    claireMessage: null,
    selectedGroup: null,
    echoSequence: [],
    echoPlayerInput: [],
    echoShowIndex: 0,
    timerEndsAt: null,
    lastAction: null,
  }
}

function actionsForMode(mode: ClaireMode, _modesCompleted: number): number {
  switch (mode) {
    case 'color-crush': return 15
    case 'pattern-echo': return 5
    case 'tile-slide': return 12
    case 'speed-blitz': return 20
    case 'mirror-world': return 10
    case 'claires-challenge': return 25
    default: return 15
  }
}

// Construct a fresh board suitable for a resumed or new Color Crush game
export function makeFreshBoard(): Board {
  return createRandomBoard(4)
}

export function makeEmptyBoard(): Board {
  return createEmptyBoard()
}
