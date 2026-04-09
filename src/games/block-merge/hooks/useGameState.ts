import { useReducer, useCallback, useEffect, useState, useRef } from 'react'
import type { GameState, GameAction, Board } from '../game/types'
import { getLevelUpThreshold } from '../game/types'
import { createEmptyBoard, dropBlock, findAnyMerge, applyMerge, applyGravity, checkGameOver, generateNextValue, purgeValue, applyBomb } from '../game/engine'
import { calculateMergePoints, calculateChainBonus } from '../game/scoring'
import { saveGame, loadGame, clearGame, loadHighScore, saveHighScore } from '../persistence'

const STEP_INTERVAL = 350
const BOMB_STREAK_THRESHOLD = 5
const BOMB_COOLDOWN_MOVES = 20

function buildGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    queue: [generateNextValue(0), generateNextValue(0), generateNextValue(0)],
    score: 0,
    highScore: loadHighScore(),
    highestTile: 2,
    totalMerges: 0,
    gameOver: false,
    phase: 'idle',
    currentMerge: null,
    chainStep: 0,
    dropCell: null,
    levelUpRemoved: null,
    minValue: 2,
    bombs: 0,
    movesSinceBomb: 0,
    ...overrides,
  }
}

function createInitialState(): GameState {
  const saved = loadGame()
  if (saved && !saved.gameOver) return buildGameState(saved)
  return buildGameState()
}

function tryMerge(state: GameState, board: Board, prefer?: { row: number; col: number }): GameState | null {
  const found = findAnyMerge(board, prefer)
  if (!found) return null

  const { board: mergedBoard, merge } = applyMerge(board, found.origin, found.group)
  const highestTile = merge.resultValue > state.highestTile
    ? merge.resultValue
    : state.highestTile

  const points = calculateMergePoints(merge.sourceValue, merge.groupSize)
  const chainBonus = calculateChainBonus(state.chainStep)
  const score = state.score + points * chainBonus

  let highScore = state.highScore
  if (score > highScore) {
    highScore = score
    saveHighScore(highScore)
  }

  return {
    ...state,
    board: mergedBoard,
    score,
    highScore,
    highestTile,
    totalMerges: state.totalMerges + 1,
    phase: 'merging',
    currentMerge: merge,
    chainStep: state.chainStep + 1,
    dropCell: merge.resultCell,
  }
}

/** Check if the score has crossed a level-up threshold (scales forever). */
function checkLevelUp(state: GameState): { removedValue: number; newMinValue: number } | null {
  const currentMin = state.minValue
  const threshold = getLevelUpThreshold(currentMin)
  if (state.score >= threshold) {
    return { removedValue: currentMin, newMinValue: currentMin * 2 }
  }
  return null
}

function settle(state: GameState): GameState {
  // Award bomb if chain reached threshold and cooldown has passed
  let bombs = state.bombs
  let movesSinceBomb = state.movesSinceBomb
  if (state.chainStep >= BOMB_STREAK_THRESHOLD && movesSinceBomb >= BOMB_COOLDOWN_MOVES) {
    bombs += 1
    movesSinceBomb = 0
  }

  // Check for level-up before checking game over
  const levelUp = checkLevelUp(state)
  if (levelUp) {
    const purgedBoard = purgeValue(state.board, levelUp.removedValue)
    const { board: settledBoard } = applyGravity(purgedBoard)

    // Replace any queue blocks below new minimum
    const newQueue = state.queue.map(v =>
      v < levelUp.newMinValue ? generateNextValue(state.score, levelUp.newMinValue) : v
    ) as [number, number, number]

    return {
      ...state,
      board: settledBoard,
      queue: newQueue,
      phase: 'levelup',
      currentMerge: null,
      dropCell: null,
      levelUpRemoved: levelUp.removedValue,
      minValue: levelUp.newMinValue,
      bombs,
      movesSinceBomb,
    }
  }

  const gameOver = checkGameOver(state.board, state.queue[0])
  if (gameOver) clearGame()

  return { ...state, phase: 'idle', currentMerge: null, dropCell: null, gameOver, bombs, movesSinceBomb }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_BLOCK': {
      if ((state.phase !== 'idle' && state.phase !== 'levelup') || state.gameOver) return state

      const col = action.col
      const value = state.queue[0]
      const { board, row, instantMerge } = dropBlock(state.board, col, value)
      if (row < 0) return state

      let score = state.score
      let highestTile = state.highestTile
      let totalMerges = state.totalMerges

      if (instantMerge) {
        const mergedValue = value * 2
        score += calculateMergePoints(value, 2)
        totalMerges += 1
        if (mergedValue > highestTile) highestTile = mergedValue
      }

      let highScore = state.highScore
      if (score > highScore) { highScore = score; saveHighScore(highScore) }

      const nextQueue: [number, number, number] = [
        state.queue[1],
        state.queue[2],
        generateNextValue(score, state.minValue),
      ]

      return {
        ...state,
        board,
        queue: nextQueue,
        score,
        highScore,
        highestTile,
        totalMerges,
        phase: 'dropping',
        currentMerge: null,
        chainStep: instantMerge ? Math.max(state.chainStep, 1) : Math.max(state.chainStep - 1, 0),
        dropCell: { row, col },
        levelUpRemoved: null,
        movesSinceBomb: state.movesSinceBomb + 1,
      }
    }

    case 'STEP': {
      if (state.phase === 'idle') return state

      if (state.phase === 'levelup') {
        return { ...state, phase: 'idle', levelUpRemoved: null }
      }

      if (state.phase === 'dropping') {
        return tryMerge(state, state.board, state.dropCell ?? undefined) ?? settle(state)
      }

      if (state.phase === 'merging') {
        const preferCell = state.currentMerge?.resultCell ?? state.dropCell
        const { board, moved } = applyGravity(state.board)
        if (moved && preferCell) {
          const val = state.board[preferCell.row][preferCell.col]
          let newPrefer = preferCell
          if (val !== null) {
            for (let r = board.length - 1; r >= 0; r--) {
              if (board[r][preferCell.col] === val) { newPrefer = { row: r, col: preferCell.col }; break }
            }
          }
          return { ...state, board, phase: 'gravity', currentMerge: null, dropCell: newPrefer }
        }
        if (moved) {
          return { ...state, board, phase: 'gravity', currentMerge: null }
        }
        return tryMerge(state, state.board, preferCell ?? undefined) ?? settle(state)
      }

      if (state.phase === 'gravity') {
        return tryMerge(state, state.board, state.dropCell ?? undefined) ?? settle(state)
      }

      return state
    }

    case 'NEW_GAME': {
      clearGame()
      return buildGameState({ highScore: state.highScore })
    }

    case 'LOAD_STATE': {
      return { ...action.state, highScore: Math.max(state.highScore, action.state.score) }
    }

    case 'ACTIVATE_BOMB': {
      if (state.phase !== 'idle' || state.bombs <= 0 || state.gameOver) return state
      return { ...state, phase: 'bomb-targeting' }
    }

    case 'CANCEL_BOMB': {
      if (state.phase !== 'bomb-targeting') return state
      return { ...state, phase: 'idle' }
    }

    case 'USE_BOMB': {
      if (state.phase !== 'bomb-targeting' || state.bombs <= 0) return state
      const { board: bombed, destroyed } = applyBomb(state.board, action.row, action.col)
      const { board: settledBoard } = applyGravity(bombed)

      // Score each destroyed tile at its face value
      const bombPoints = destroyed.reduce((sum, v) => sum + v, 0)
      const newScore = state.score + bombPoints
      let highScore = state.highScore
      if (newScore > highScore) { highScore = newScore; saveHighScore(highScore) }

      // Transition to gravity so the STEP loop checks for cascading merges
      return {
        ...state,
        board: settledBoard,
        bombs: state.bombs - 1,
        score: newScore,
        highScore,
        phase: 'gravity',
        chainStep: 0,
        currentMerge: null,
        dropCell: null,
      }
    }

    default:
      return state
  }
}

export function useGameState() {
  const [initial] = useState(createInitialState)
  const [state, dispatch] = useReducer(gameReducer, initial)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const placeBlock = useCallback((col: number) => {
    dispatch({ type: 'PLACE_BLOCK', col })
  }, [])

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  const dismissLevelUp = useCallback(() => {
    dispatch({ type: 'STEP' })
  }, [])

  const activateBomb = useCallback(() => {
    dispatch({ type: 'ACTIVATE_BOMB' })
  }, [])

  const cancelBomb = useCallback(() => {
    dispatch({ type: 'CANCEL_BOMB' })
  }, [])

  const useBomb = useCallback((row: number, col: number) => {
    dispatch({ type: 'USE_BOMB', row, col })
  }, [])

  // Auto-step when animating
  useEffect(() => {
    if (state.phase === 'idle' || state.phase === 'levelup') return
    const delay = state.phase === 'dropping' ? 250 : STEP_INTERVAL
    stepTimerRef.current = setTimeout(() => {
      dispatch({ type: 'STEP' })
    }, delay)
    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
    }
  }, [state.phase, state.currentMerge])

  // Auto-save when settling to idle
  useEffect(() => {
    if (state.phase === 'idle' && !state.gameOver) saveGame(state)
  }, [state.phase, state.gameOver])

  return { state, placeBlock, newGame, dismissLevelUp, activateBomb, cancelBomb, useBomb }
}
