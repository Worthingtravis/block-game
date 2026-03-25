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
import { pickDialogue, updateMood } from '../dialogue/claire-ai'
import { saveGame, loadGame, loadHighScore, saveHighScore, hydrateState } from '../persistence'

const MIN_GROUP_SIZE = 3
const INTRO_DELAY_MS = 600

// Scoring: exponential reward for bigger groups
function scoreForClear(groupSize: number, multiplier: number, streak: number): number {
  const base = groupSize * groupSize * 2
  const streakBonus = 1 + streak * 0.1
  return Math.round(base * multiplier * streakBonus)
}

export function buildInitialState(): GameState {
  const saved = loadGame()
  const highScore = loadHighScore()

  if (saved) {
    const partial = hydrateState(saved, highScore)
    const board = partial.board ?? createRandomBoard(4)
    return {
      board,
      mode: 'color-crush',
      modePhase: 'active',
      score: partial.score ?? 0,
      highScore,
      claireMultiplier: partial.claireMultiplier ?? 1,
      streak: partial.streak ?? 0,
      modesCompleted: partial.modesCompleted ?? 0,
      actionsRemaining: 0,
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
    }
  }

  return {
    board: createRandomBoard(4),
    mode: 'color-crush',
    modePhase: 'intro',
    score: 0,
    highScore,
    claireMultiplier: 1,
    streak: 0,
    modesCompleted: 0,
    actionsRemaining: 0,
    gameOver: false,
    claireMood: 'happy',
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

function handleColorCrush(state: GameState, row: number, col: number): GameState {
  const cell = state.board[row]?.[col]
  if (!cell || cell.color === null || cell.obstacle) return state

  const group = findGroup(state.board, row, col)

  // Tapped a group too small — break streak, mild penalty
  if (group.length < MIN_GROUP_SIZE) {
    return {
      ...state,
      streak: 0,
      claireMultiplier: Math.max(1, state.claireMultiplier - 0.1),
      claireMood: updateMood({ ...state, lastAction: 'bad_move' }, 'bad_move'),
      claireMessage: pickDialogue('bad_move', state),
      lastAction: 'bad_move',
    }
  }

  // Successful clear
  const newStreak = state.streak + 1
  const multiplierGain = group.length >= 6 ? 0.5 : group.length >= 4 ? 0.3 : 0.15
  const newMultiplier = Math.min(5, state.claireMultiplier + multiplierGain)
  const pts = scoreForClear(group.length, state.claireMultiplier, newStreak)
  const newScore = state.score + pts
  const newHigh = Math.max(state.highScore, newScore)
  if (newHigh > state.highScore) saveHighScore(newHigh)

  // Clear, gravity, fill
  let newBoard = clearGroup(state.board, group)
  newBoard = applyGravity(newBoard)

  // Determine color count based on score (progressive difficulty)
  const colorCount = newScore >= 5000 ? 5 : newScore >= 2000 ? 4 : newScore >= 500 ? 3 : 3
  newBoard = fillEmpty(newBoard, colorCount)

  // If still stuck after fill (extremely rare), regenerate
  if (!hasValidMoves(newBoard)) {
    newBoard = createRandomBoard(colorCount)
  }

  const modesCompleted = state.modesCompleted + 1

  // Pick Claire's reaction
  let trigger: 'streak' | 'good_move' = 'good_move'
  if (newStreak >= 5) trigger = 'streak'

  let message = pickDialogue(trigger, { ...state, streak: newStreak, score: newScore })

  // Special messages for big groups
  if (group.length >= 8) message = "WHAT. That was insane."
  else if (group.length >= 6) message = "Massive clear! I felt that."
  else if (group.length >= 5) message = "Ooh. Big one."

  // Score milestone messages
  if (newScore >= 10000 && state.score < 10000) message = "10K?! You're built different."
  if (newScore >= 5000 && state.score < 5000) message = "5K. Not bad at all."
  if (newScore >= 1000 && state.score < 1000) message = "First thousand. Keep going."

  const mood: ClaireMood = updateMood({ ...state, streak: newStreak, claireMultiplier: newMultiplier }, trigger)

  return {
    ...state,
    board: newBoard,
    score: newScore,
    highScore: newHigh,
    claireMultiplier: newMultiplier,
    streak: newStreak,
    modesCompleted,
    claireMood: mood,
    claireMessage: message,
    lastAction: 'good_move',
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.gameOver && action.type !== 'NEW_GAME') return state

  switch (action.type) {
    case 'TAP_CELL': {
      if (state.modePhase !== 'active') return state
      return handleColorCrush(state, action.row, action.col)
    }

    case 'STEP': {
      if (state.modePhase === 'intro') {
        return { ...state, modePhase: 'active' }
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
      return {
        board: createRandomBoard(3),
        mode: 'color-crush',
        modePhase: 'intro',
        score: 0,
        highScore: state.highScore,
        claireMultiplier: 1,
        streak: 0,
        modesCompleted: 0,
        actionsRemaining: 0,
        gameOver: false,
        claireMood: 'happy',
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

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, buildInitialState)

  // Auto-step intro phase
  useEffect(() => {
    if (state.modePhase !== 'intro') return
    const timer = setTimeout(() => dispatch({ type: 'STEP' }), INTRO_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state.modePhase])

  // Auto-save
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (state.modePhase !== 'active' || state.gameOver) return
    if (saveRef.current) clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => saveGame(state), 1000)
    return () => { if (saveRef.current) clearTimeout(saveRef.current) }
  }, [state])

  const tapCell = useCallback((row: number, col: number) => {
    dispatch({ type: 'TAP_CELL', row, col })
  }, [])

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  return { state, dispatch, tapCell, newGame }
}
