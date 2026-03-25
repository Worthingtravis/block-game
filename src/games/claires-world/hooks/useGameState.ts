import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { GameState, GameAction, ClaireMood } from '../game/types'
import {
  createRandomBoard,
  applyGravity,
  fillEmpty,
  findGroup,
  clearGroup,
  hasValidMoves,
} from '../game/engine'
import {
  selectNextMode,
  pickDialogue,
  updateMood,
  getActionsForMode,
  getDifficulty,
} from '../dialogue/claire-ai'
import { saveGame, loadGame, loadHighScore, saveHighScore, hydrateState } from '../persistence'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MIN_GROUP_SIZE = 3
const INTRO_DELAY_MS = 350
const OUTRO_DELAY_MS = 350

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreForClear(groupSize: number, multiplier: number, streak: number): number {
  const base = groupSize * 10
  const streakBonus = streak > 1 ? streak * 5 : 0
  return Math.round((base + streakBonus) * multiplier)
}

// ---------------------------------------------------------------------------
// buildInitialState
// ---------------------------------------------------------------------------

export function buildInitialState(): GameState {
  const saved = loadGame()
  const highScore = loadHighScore()

  if (saved) {
    const partial = hydrateState(saved, highScore)
    const modesCompleted = partial.modesCompleted ?? 0
    const mode = partial.mode ?? 'color-crush'
    return {
      board: partial.board ?? createRandomBoard(getDifficulty(modesCompleted).colorCount),
      mode,
      modePhase: 'active',
      score: partial.score ?? 0,
      highScore,
      claireMultiplier: partial.claireMultiplier ?? 1,
      streak: partial.streak ?? 0,
      modesCompleted,
      actionsRemaining: partial.actionsRemaining ?? getActionsForMode(mode, modesCompleted),
      gameOver: false,
      claireMood: 'neutral',
      claireMessage: null,
      selectedGroup: null,
      echoSequence: [],
      echoPlayerInput: [],
      echoShowIndex: 0,
      echoErrors: partial.echoErrors ?? 0,
      timerEndsAt: null,
      lastAction: null,
    }
  }

  const diff = getDifficulty(0)
  return {
    board: createRandomBoard(diff.colorCount),
    mode: 'color-crush',
    modePhase: 'intro',
    score: 0,
    highScore,
    claireMultiplier: 1,
    streak: 0,
    modesCompleted: 0,
    actionsRemaining: getActionsForMode('color-crush', 0),
    gameOver: false,
    claireMood: 'neutral',
    claireMessage: pickDialogue('start', {} as GameState),
    selectedGroup: null,
    echoSequence: [],
    echoPlayerInput: [],
    echoShowIndex: 0,
    echoErrors: 0,
    timerEndsAt: null,
    lastAction: null,
  }
}

// ---------------------------------------------------------------------------
// Color Crush handler (uses engine + claire-ai)
// ---------------------------------------------------------------------------

function handleColorCrush(state: GameState, row: number, col: number): GameState {
  const cell = state.board[row]?.[col]
  if (!cell || cell.obstacle) return state

  const diff = getDifficulty(state.modesCompleted)
  const group = findGroup(state.board, row, col)

  if (group.length < MIN_GROUP_SIZE) {
    const mood = updateMood({ ...state, lastAction: 'bad_move' }, 'bad_move')
    return {
      ...state,
      streak: 0,
      claireMultiplier: Math.max(1, state.claireMultiplier - 0.2),
      claireMood: mood,
      claireMessage: pickDialogue('bad_move', state),
      lastAction: 'bad_move',
    }
  }

  const newStreak = state.streak + 1
  const newMultiplier = Math.min(5, state.claireMultiplier + (group.length >= 5 ? 0.5 : 0.2))
  const pts = scoreForClear(group.length, state.claireMultiplier, newStreak)
  const newScore = state.score + pts
  const newHigh = Math.max(state.highScore, newScore)
  if (newHigh > state.highScore) saveHighScore(newHigh)

  let newBoard = clearGroup(state.board, group)
  newBoard = applyGravity(newBoard)
  newBoard = fillEmpty(newBoard, diff.colorCount)

  const newActionsRemaining = state.actionsRemaining - 1
  const modeComplete = newActionsRemaining <= 0
  const boardStuck = !hasValidMoves(newBoard) && !modeComplete

  const afterState: GameState = {
    ...state,
    board: newBoard,
    score: newScore,
    highScore: newHigh,
    claireMultiplier: newMultiplier,
    streak: newStreak,
    actionsRemaining: newActionsRemaining,
    lastAction: 'good_move',
  }

  const eventTag = newStreak >= 5 ? 'streak' : 'good_move'
  const mood: ClaireMood = updateMood(afterState, eventTag)
  const trigger = newStreak >= 5 ? 'streak' as const : 'good_move' as const

  if (modeComplete) {
    return {
      ...afterState,
      modePhase: 'outro',
      claireMood: 'excited',
      claireMessage: pickDialogue('mode_switch', afterState),
    }
  }

  if (boardStuck) {
    return {
      ...afterState,
      gameOver: true,
      claireMood: 'annoyed',
      claireMessage: pickDialogue('game_over', afterState),
      lastAction: 'game_over',
    }
  }

  return {
    ...afterState,
    claireMood: mood,
    claireMessage: pickDialogue(trigger, afterState),
  }
}

// ---------------------------------------------------------------------------
// gameReducer
// ---------------------------------------------------------------------------

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.gameOver && action.type !== 'NEW_GAME') return state

  switch (action.type) {
    case 'TAP_CELL': {
      if (state.modePhase !== 'active') return state
      switch (state.mode) {
        case 'color-crush':
          return handleColorCrush(state, action.row, action.col)
        default:
          // Other modes not yet implemented — delegate to color-crush handler
          return handleColorCrush(state, action.row, action.col)
      }
    }

    case 'STEP': {
      if (state.modePhase === 'intro') {
        return { ...state, modePhase: 'active' }
      }
      if (state.modePhase === 'outro') {
        return { ...state, modePhase: 'transitioning' }
      }
      if (state.modePhase === 'transitioning') {
        const nextMode = selectNextMode(state)
        return gameReducer(state, { type: 'START_MODE', mode: nextMode })
      }
      return state
    }

    case 'START_MODE': {
      const { mode } = action
      const newModesCompleted = state.modesCompleted + 1
      const diff = getDifficulty(newModesCompleted)
      return {
        ...state,
        mode,
        modePhase: 'intro',
        modesCompleted: newModesCompleted,
        actionsRemaining: getActionsForMode(mode, newModesCompleted),
        board: createRandomBoard(diff.colorCount),
        selectedGroup: null,
        echoSequence: [],
        echoPlayerInput: [],
        echoShowIndex: 0,
        echoErrors: 0,
        timerEndsAt: null,
        claireMood: 'excited',
        claireMessage: pickDialogue('mode_switch', state),
        lastAction: 'mode_switch',
      }
    }

    case 'TRANSITION_DONE': {
      return { ...state, modePhase: 'active', claireMessage: null }
    }

    case 'TIMER_TICK': {
      if (!state.timerEndsAt) return state
      if (Date.now() >= state.timerEndsAt) {
        return {
          ...state,
          modePhase: 'outro',
          claireMessage: pickDialogue('mode_switch', state),
          claireMood: 'neutral',
          timerEndsAt: null,
          lastAction: 'timer_end',
        }
      }
      return state
    }

    case 'IDLE_TICK': {
      if (state.modePhase !== 'active') return state
      return {
        ...state,
        claireMood: 'annoyed',
        claireMessage: pickDialogue('idle', state),
        lastAction: 'idle',
      }
    }

    case 'NEW_GAME': {
      const diff = getDifficulty(0)
      return {
        board: createRandomBoard(diff.colorCount),
        mode: 'color-crush',
        modePhase: 'intro',
        score: 0,
        highScore: state.highScore,
        claireMultiplier: 1,
        streak: 0,
        modesCompleted: 0,
        actionsRemaining: getActionsForMode('color-crush', 0),
        gameOver: false,
        claireMood: 'neutral',
        claireMessage: pickDialogue('start', state),
        selectedGroup: null,
        echoSequence: [],
        echoPlayerInput: [],
        echoShowIndex: 0,
        echoErrors: 0,
        timerEndsAt: null,
        lastAction: null,
      }
    }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// useGameState hook
// ---------------------------------------------------------------------------

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, buildInitialState)

  // Auto-step during intro / outro phases (350ms delay)
  useEffect(() => {
    if (state.modePhase === 'active') return
    const delay = state.modePhase === 'intro' ? INTRO_DELAY_MS : OUTRO_DELAY_MS
    const timer = setTimeout(() => {
      dispatch({ type: 'STEP' })
    }, delay)
    return () => clearTimeout(timer)
  }, [state.modePhase])

  // Auto-save when in active phase (idle save on state change)
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (state.modePhase !== 'active' || state.gameOver) return
    if (saveRef.current !== null) clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => {
      saveGame(state)
    }, 1000)
    return () => {
      if (saveRef.current !== null) clearTimeout(saveRef.current)
    }
  }, [state])

  const tapCell = useCallback((row: number, col: number) => {
    dispatch({ type: 'TAP_CELL', row, col })
  }, [])

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  const transitionDone = useCallback(() => {
    dispatch({ type: 'TRANSITION_DONE' })
  }, [])

  return { state, dispatch, tapCell, newGame, transitionDone }
}
