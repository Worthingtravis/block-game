import { useReducer, useCallback, useEffect, useState, useRef } from 'react'
import type { GameState, GameAction } from '../game/types'
import { createEmptyBoard, findMatches, applyMatches, checkGameOver, generateTile, placeTile, getTopColor } from '../game/engine'
import { calculateMatchScore } from '../game/scoring'
import { saveGame, loadGame, clearGame, loadHighScore, saveHighScore } from '../persistence'

const STEP_INTERVAL = 350

function buildGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    queue: [generateTile(), generateTile(), generateTile()],
    score: 0,
    highScore: loadHighScore(),
    totalClears: 0,
    gameOver: false,
    phase: 'idle',
    lastMatch: null,
    chainStep: 0,
    ...overrides,
  }
}

function createInitialState(): GameState {
  const saved = loadGame()
  if (saved && !saved.gameOver) return buildGameState(saved)
  return buildGameState()
}

/** Build a MatchResult from findMatches pairs */
function buildMatchResult(board: ReturnType<typeof createEmptyBoard>, pairs: [number, number][], chainDepth: number) {
  if (pairs.length === 0) return null
  const cellSet = new Set<number>()
  for (const [a, b] of pairs) { cellSet.add(a); cellSet.add(b) }
  const cellIndices = [...cellSet]
  // Determine the matched color from the first pair
  const color = getTopColor(board, pairs[0][0])
  if (!color) return null
  return { cellIndices, color, chainDepth }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_TILE': {
      if (state.phase !== 'idle' || state.gameOver) return state

      const cellIndex = action.cellIndex
      // placeTile returns null if cell is occupied
      const newBoard = placeTile(state.board, cellIndex, state.queue[0])
      if (!newBoard) return state

      const nextQueue: [typeof state.queue[0], typeof state.queue[1], typeof state.queue[2]] = [
        state.queue[1],
        state.queue[2],
        generateTile(),
      ]

      return {
        ...state,
        board: newBoard,
        queue: nextQueue,
        phase: 'placing',
        lastMatch: null,
        chainStep: Math.max(state.chainStep - 1, 0),
      }
    }

    case 'STEP': {
      if (state.phase === 'idle') return state

      if (state.phase === 'placing') {
        const pairs = findMatches(state.board)
        if (pairs.length > 0) {
          const match = buildMatchResult(state.board, pairs, state.chainStep)
          const { board: newBoard, cleared } = applyMatches(state.board, pairs)
          const points = calculateMatchScore(cleared, state.chainStep)
          const score = state.score + points
          let highScore = state.highScore
          if (score > highScore) { highScore = score; saveHighScore(highScore) }
          return {
            ...state,
            board: newBoard,
            score,
            highScore,
            totalClears: state.totalClears + cleared,
            phase: 'matching',
            lastMatch: match,
            chainStep: state.chainStep + 1,
          }
        }
        // No matches — settle
        return settle(state)
      }

      if (state.phase === 'matching' || state.phase === 'chain') {
        const pairs = findMatches(state.board)
        if (pairs.length > 0) {
          const match = buildMatchResult(state.board, pairs, state.chainStep)
          const { board: newBoard, cleared } = applyMatches(state.board, pairs)
          const points = calculateMatchScore(cleared, state.chainStep)
          const score = state.score + points
          let highScore = state.highScore
          if (score > highScore) { highScore = score; saveHighScore(highScore) }
          return {
            ...state,
            board: newBoard,
            score,
            highScore,
            totalClears: state.totalClears + cleared,
            phase: 'chain',
            lastMatch: match,
            chainStep: state.chainStep + 1,
          }
        }
        // No more matches — settle
        return settle(state)
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

function settle(state: GameState): GameState {
  const gameOver = checkGameOver(state.board)
  if (gameOver) clearGame()
  return {
    ...state,
    phase: 'idle',
    lastMatch: null,
    chainStep: 0,
    gameOver,
  }
}

export function createFreshState(): GameState {
  return buildGameState()
}

export function useGameState() {
  const [initial] = useState(createInitialState)
  const [state, dispatch] = useReducer(gameReducer, initial)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const placeTileAt = useCallback((cellIndex: number) => {
    dispatch({ type: 'PLACE_TILE', cellIndex })
  }, [])

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  // Auto-step when not idle
  useEffect(() => {
    if (state.phase === 'idle') return
    stepTimerRef.current = setTimeout(() => {
      dispatch({ type: 'STEP' })
    }, STEP_INTERVAL)
    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
    }
  }, [state.phase, state.lastMatch])

  // Auto-save on idle
  useEffect(() => {
    if (state.phase === 'idle' && !state.gameOver) saveGame(state)
  }, [state.phase, state.gameOver])

  return { state, placeTileAt, newGame }
}
