import { useReducer, useCallback, useEffect, useState, useRef } from 'react'
import type { GameState, GameAction, MergeValue, Board } from '../game/types'
import { createEmptyBoard, dropBlock, findAnyMerge, applyMerge, applyGravity, checkGameOver, generateNextValue } from '../game/engine'
import { saveGame, loadGame, clearGame, loadHighScore, saveHighScore } from '../persistence'

const STEP_INTERVAL = 350

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
    dropCell: null,
    ...overrides,
  }
}

function createInitialState(): GameState {
  const saved = loadGame()
  if (saved && !saved.gameOver) return buildGameState(saved)
  return buildGameState()
}

/** Try to find and apply a merge. Returns the updated state in 'merging' phase, or null if no merge found. */
function tryMerge(state: GameState, board: Board, prefer?: { row: number; col: number }): GameState | null {
  const found = findAnyMerge(board, prefer)
  if (!found) return null

  const { board: mergedBoard, merge } = applyMerge(board, found.origin, found.group)
  const highestTile = merge.resultValue > state.highestTile
    ? merge.resultValue as MergeValue
    : state.highestTile
  const score = state.score + merge.resultValue
  const highScore = score > state.highScore
    ? (saveHighScore(score), score)
    : state.highScore

  return {
    ...state,
    board: mergedBoard,
    score,
    highScore,
    highestTile,
    totalMerges: state.totalMerges + 1,
    phase: 'merging',
    currentMerge: merge,
    dropCell: null,
  }
}

/** Settle the board: check game over and return idle state. */
function settle(state: GameState): GameState {
  const gameOver = checkGameOver(state.board)
  if (gameOver) clearGame()
  return { ...state, phase: 'idle', currentMerge: null, dropCell: null, gameOver }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_BLOCK': {
      if (state.phase !== 'idle' || state.gameOver) return state

      const col = action.col
      const value = state.queue[0]
      const { board, row } = dropBlock(state.board, col, value)
      if (row < 0) return state

      const nextQueue: [MergeValue, MergeValue, MergeValue] = [
        state.queue[1],
        state.queue[2],
        generateNextValue(state.score),
      ]

      return {
        ...state,
        board,
        queue: nextQueue,
        phase: 'dropping',
        currentMerge: null,
        dropCell: { row, col },
      }
    }

    case 'STEP': {
      if (state.phase === 'idle') return state

      if (state.phase === 'dropping') {
        return tryMerge(state, state.board, state.dropCell ?? undefined) ?? settle(state)
      }

      if (state.phase === 'merging') {
        const { board, moved } = applyGravity(state.board)
        if (moved) {
          return { ...state, board, phase: 'gravity', currentMerge: null }
        }
        return tryMerge(state, state.board) ?? settle(state)
      }

      if (state.phase === 'gravity') {
        return tryMerge(state, state.board) ?? settle(state)
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

  // Auto-step when not idle
  useEffect(() => {
    if (state.phase === 'idle') return
    const delay = state.phase === 'dropping' ? 250 : STEP_INTERVAL
    stepTimerRef.current = setTimeout(() => {
      dispatch({ type: 'STEP' })
    }, delay)
    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
    }
  }, [state.phase, state.board])

  // Auto-save when idle
  useEffect(() => {
    if (state.phase === 'idle' && !state.gameOver) saveGame(state)
  }, [state])

  return { state, placeBlock, newGame }
}
