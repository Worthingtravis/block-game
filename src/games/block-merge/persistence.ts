import type { GameState } from './game/types'

const LOCAL_KEY = 'block-merge-current-game'
const HIGH_SCORE_KEY = 'block-merge-high-score'

type StoredMergeGame = {
  board: (number | null)[][]
  queue: [number, number, number]
  score: number
  highestTile: number
  totalMerges: number
}

export function saveGame(state: GameState): void {
  try {
    const stored: StoredMergeGame = {
      board: state.board,
      queue: state.queue,
      score: state.score,
      highestTile: state.highestTile,
      totalMerges: state.totalMerges,
    }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(stored))
  } catch { /* */ }
}

export function loadGame(): Partial<GameState> | null {
  try {
    const stored = localStorage.getItem(LOCAL_KEY)
    if (!stored) return null
    const data: StoredMergeGame = JSON.parse(stored)
    return {
      board: data.board as GameState['board'],
      queue: data.queue as GameState['queue'],
      score: data.score,
      highestTile: data.highestTile,
      totalMerges: data.totalMerges,
    }
  } catch { return null }
}

export function clearGame(): void {
  try { localStorage.removeItem(LOCAL_KEY) } catch { /* */ }
}

export function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY)
    return stored ? parseInt(stored, 10) || 0 : 0
  } catch { return 0 }
}

export function saveHighScore(score: number): void {
  try { localStorage.setItem(HIGH_SCORE_KEY, String(score)) } catch { /* */ }
}
