import { describe, it, expect, beforeEach } from 'vitest'
import { saveGame, loadGame, clearGame, loadHighScore, saveHighScore } from '../persistence'
import type { GameState } from '../game/types'
import { createEmptyBoard } from '../game/engine'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    queue: [['blue'], ['red'], ['green']],
    score: 0,
    highScore: 0,
    totalClears: 0,
    gameOver: false,
    phase: 'idle',
    lastMatch: null,
    chainStep: 0,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('saveGame / loadGame', () => {
  it('returns null when nothing is saved', () => {
    expect(loadGame()).toBeNull()
  })

  it('round-trips board, queue, score, totalClears', () => {
    const board = createEmptyBoard()
    board[0] = ['blue', 'red']
    board[5] = ['green']

    const state = makeState({
      board,
      queue: [['blue', 'red'], ['yellow'], ['purple', 'green', 'blue']],
      score: 250,
      totalClears: 12,
    })

    saveGame(state)
    const loaded = loadGame()

    expect(loaded).not.toBeNull()
    expect(loaded!.score).toBe(250)
    expect(loaded!.totalClears).toBe(12)
    expect(loaded!.board![0]).toEqual(['blue', 'red'])
    expect(loaded!.board![5]).toEqual(['green'])
    expect(loaded!.queue).toEqual([['blue', 'red'], ['yellow'], ['purple', 'green', 'blue']])
  })

  it('does not save phase (resumes as idle)', () => {
    const state = makeState({ phase: 'matching', score: 100 })
    saveGame(state)
    const loaded = loadGame()
    // phase is not in the stored fields
    expect(loaded).not.toHaveProperty('phase')
  })
})

describe('clearGame', () => {
  it('removes saved game', () => {
    saveGame(makeState({ score: 100 }))
    clearGame()
    expect(loadGame()).toBeNull()
  })
})

describe('loadHighScore / saveHighScore', () => {
  it('returns 0 when no high score saved', () => {
    expect(loadHighScore()).toBe(0)
  })

  it('saves and loads high score', () => {
    saveHighScore(1234)
    expect(loadHighScore()).toBe(1234)
  })

  it('overwrites previous high score', () => {
    saveHighScore(500)
    saveHighScore(9999)
    expect(loadHighScore()).toBe(9999)
  })
})
