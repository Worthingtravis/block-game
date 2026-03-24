import { useReducer, useCallback, useEffect, useState, useRef } from 'react'
import type { GameState, GameAction, MergeValue } from '../game/types'
import { createEmptyBoard, dropBlock, findAnyMerge, applyMerge, applyGravity, checkGameOver, generateNextValue } from '../game/engine'
import { BOARD_SIZE } from '../game/types'
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
    dropCol: null,
    ...overrides,
  }
}

function createInitialState(): GameState {
  const saved = loadGame()
  if (saved && !saved.gameOver) return buildGameState(saved)
  return buildGameState()
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_BLOCK': {
      if (state.phase !== 'idle' || state.gameOver) return state
      const col = action.col

      // Check column has space
      let hasSpace = false
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (state.board[r][col] === null) { hasSpace = true; break }
      }
      if (!hasSpace) return state

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
        dropCol: col,
      }
    }

    case 'STEP': {
      if (state.phase === 'idle') return state

      if (state.phase === 'dropping') {
        // After drop animation, check for merges
        const found = findAnyMerge(state.board)
        if (found) {
          const { board, merge } = applyMerge(state.board, found.origin, found.group)
          let highestTile = state.highestTile
          if (merge.resultValue > highestTile) highestTile = merge.resultValue as MergeValue
          const score = state.score + merge.resultValue
          let highScore = state.highScore
          if (score > highScore) { highScore = score; saveHighScore(highScore) }

          return {
            ...state,
            board,
            score,
            highScore,
            highestTile,
            totalMerges: state.totalMerges + 1,
            phase: 'merging',
            currentMerge: merge,
            dropCol: null,
          }
        }
        // No merge — settle
        const gameOver = checkGameOver(state.board)
        if (gameOver) clearGame()
        return { ...state, phase: 'idle', currentMerge: null, dropCol: null, gameOver }
      }

      if (state.phase === 'merging') {
        // After merge animation, apply gravity
        const { board, moved } = applyGravity(state.board)
        if (moved) {
          return { ...state, board, phase: 'gravity', currentMerge: null }
        }
        // No gravity needed — check for more merges
        const found = findAnyMerge(state.board)
        if (found) {
          const { board: mergedBoard, merge } = applyMerge(state.board, found.origin, found.group)
          let highestTile = state.highestTile
          if (merge.resultValue > highestTile) highestTile = merge.resultValue as MergeValue
          const score = state.score + merge.resultValue
          let highScore = state.highScore
          if (score > highScore) { highScore = score; saveHighScore(highScore) }

          return {
            ...state,
            board: mergedBoard,
            score,
            highScore,
            highestTile,
            totalMerges: state.totalMerges + 1,
            phase: 'merging',
            currentMerge: merge,
          }
        }
        // No more merges — settle
        const gameOver = checkGameOver(state.board)
        if (gameOver) clearGame()
        return { ...state, phase: 'idle', currentMerge: null, gameOver }
      }

      if (state.phase === 'gravity') {
        // After gravity animation, check for new merges
        const found = findAnyMerge(state.board)
        if (found) {
          const { board, merge } = applyMerge(state.board, found.origin, found.group)
          let highestTile = state.highestTile
          if (merge.resultValue > highestTile) highestTile = merge.resultValue as MergeValue
          const score = state.score + merge.resultValue
          let highScore = state.highScore
          if (score > highScore) { highScore = score; saveHighScore(highScore) }

          return {
            ...state,
            board,
            score,
            highScore,
            highestTile,
            totalMerges: state.totalMerges + 1,
            phase: 'merging',
            currentMerge: merge,
          }
        }
        // No merges after gravity — settle
        const gameOver = checkGameOver(state.board)
        if (gameOver) clearGame()
        return { ...state, phase: 'idle', currentMerge: null, gameOver }
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
