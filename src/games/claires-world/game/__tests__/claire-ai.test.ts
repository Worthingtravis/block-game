import { describe, it, expect } from 'vitest'
import {
  selectNextMode,
  pickDialogue,
  updateMood,
  getActionsForMode,
  getDifficulty,
} from '../../dialogue/claire-ai'
import { CLAIRE_LINES } from '../../dialogue/lines'
import type { GameState, ClaireMode } from '../types'
import { createEmptyBoard } from '../engine'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    mode: 'color-crush',
    modePhase: 'active',
    score: 0,
    highScore: 0,
    claireMultiplier: 1,
    streak: 0,
    modesCompleted: 0,
    actionsRemaining: 10,
    gameOver: false,
    claireMood: 'neutral',
    claireMessage: null,
    selectedGroup: null,
    echoSequence: [],
    echoPlayerInput: [],
    echoShowIndex: 0,
    echoErrors: 0,
    timerEndsAt: null,
    lastAction: null,
    ...overrides,
  }
}

describe('selectNextMode', () => {
  it('never returns the current mode', () => {
    const state = makeState({ mode: 'color-crush' })
    for (let i = 0; i < 50; i++) {
      expect(selectNextMode(state)).not.toBe('color-crush')
    }
  })

  it('returns a valid ClaireMode', () => {
    const validModes: ClaireMode[] = [
      'color-crush', 'pattern-echo', 'tile-slide', 'speed-blitz', 'mirror-world', 'claires-challenge',
    ]
    const state = makeState()
    for (let i = 0; i < 20; i++) {
      expect(validModes).toContain(selectNextMode(state))
    }
  })

  it('still works when current mode is claires-challenge', () => {
    const state = makeState({ mode: 'claires-challenge' })
    const result = selectNextMode(state)
    expect(result).not.toBe('claires-challenge')
  })
})

describe('pickDialogue', () => {
  it('returns a string from the correct pool', () => {
    const state = makeState()
    const line = pickDialogue('start', state)
    expect(CLAIRE_LINES.start).toContain(line)
  })

  it('returns lines for every trigger type', () => {
    const triggers = Object.keys(CLAIRE_LINES) as (keyof typeof CLAIRE_LINES)[]
    const state = makeState()
    triggers.forEach(trigger => {
      const line = pickDialogue(trigger, state)
      expect(typeof line).toBe('string')
      expect(line.length).toBeGreaterThan(0)
    })
  })

  it('returns different lines across calls (probabilistic)', () => {
    const state = makeState()
    const results = new Set<string>()
    for (let i = 0; i < 30; i++) results.add(pickDialogue('good_move', state))
    // With 8 lines and 30 draws, we expect some variety
    expect(results.size).toBeGreaterThan(1)
  })
})

describe('updateMood', () => {
  it('returns annoyed on bad_move with low multiplier', () => {
    const state = makeState({ claireMultiplier: 1 })
    expect(updateMood(state, 'bad_move')).toBe('annoyed')
  })

  it('returns neutral on bad_move with higher multiplier', () => {
    const state = makeState({ claireMultiplier: 2 })
    expect(updateMood(state, 'bad_move')).toBe('neutral')
  })

  it('returns happy on game_over', () => {
    const state = makeState()
    expect(updateMood(state, 'game_over')).toBe('happy')
  })

  it('returns manic on high streak', () => {
    const state = makeState({ streak: 5 })
    expect(updateMood(state, 'good_move')).toBe('manic')
  })

  it('returns excited on multiplier >= 3', () => {
    const state = makeState({ claireMultiplier: 3, streak: 2 })
    expect(updateMood(state, 'good_move')).toBe('excited')
  })

  it('returns neutral in default state', () => {
    const state = makeState({ claireMultiplier: 1, streak: 0 })
    expect(updateMood(state, 'nothing')).toBe('neutral')
  })
})

describe('getActionsForMode', () => {
  it('returns positive action count for all modes', () => {
    const modes: ClaireMode[] = [
      'color-crush', 'pattern-echo', 'tile-slide', 'speed-blitz', 'mirror-world', 'claires-challenge',
    ]
    modes.forEach(mode => {
      expect(getActionsForMode(mode, 0)).toBeGreaterThan(0)
    })
  })

  it('returns fewer actions as modesCompleted increases', () => {
    const early = getActionsForMode('color-crush', 0)
    const late = getActionsForMode('color-crush', 5)
    expect(late).toBeLessThanOrEqual(early)
  })

  it('never returns fewer than 4 actions', () => {
    const modes: ClaireMode[] = ['color-crush', 'speed-blitz', 'claires-challenge']
    modes.forEach(mode => {
      expect(getActionsForMode(mode, 100)).toBeGreaterThanOrEqual(4)
    })
  })
})

describe('getDifficulty', () => {
  it('starts with 3 colors at stage 0', () => {
    const d = getDifficulty(0)
    expect(d.colorCount).toBe(3)
  })

  it('increases to 5 colors at higher stages', () => {
    const d = getDifficulty(6)
    expect(d.colorCount).toBe(5)
  })

  it('decreases blitz time as stages increase', () => {
    const early = getDifficulty(0).blitzSeconds
    const late = getDifficulty(8).blitzSeconds
    expect(late).toBeLessThan(early)
  })

  it('never drops blitz below 12 seconds', () => {
    const d = getDifficulty(100)
    expect(d.blitzSeconds).toBeGreaterThanOrEqual(12)
  })

  it('increases echoLength over time', () => {
    const early = getDifficulty(0).echoLength
    const late = getDifficulty(8).echoLength
    expect(late).toBeGreaterThan(early)
  })

  it('adds obstacles after stage 3', () => {
    expect(getDifficulty(3).obstacleChance).toBe(0)
    expect(getDifficulty(4).obstacleChance).toBeGreaterThan(0)
  })
})
