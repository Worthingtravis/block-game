import { useReducer, useCallback, useEffect, useState } from 'react'
import type { GameState, GameAction, Cell, MergeValue } from '../game/types'
import { createEmptyBoard, resolveChains, checkGameOver, generateNextValue } from '../game/engine'
import { BOARD_SIZE } from '../game/types'
import { calculateMergeScore } from '../game/scoring'
import { saveGame, loadGame, clearGame, loadHighScore, saveHighScore } from '../persistence'

function buildGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    queue: [generateNextValue(0), generateNextValue(0), generateNextValue(0)],
    score: 0,
    highScore: loadHighScore(),
    highestTile: 2,
    comboMultiplier: 1,
    totalMerges: 0,
    gameOver: false,
    lastMerges: null,
    ...overrides,
  }
}

function createInitialState(): GameState {
  const saved = loadGame()
  if (saved && !saved.gameOver) {
    return buildGameState(saved)
  }
  return buildGameState()
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_BLOCK': {
      const { position } = action
      if (state.gameOver) return state

      // Drop block to the lowest empty cell in this column
      const col = position.col
      let dropRow = -1
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (state.board[r][col] === null) { dropRow = r; break }
      }
      if (dropRow < 0) return state // column is full

      const currentValue = state.queue[0]
      const newBoard = state.board.map(r => [...r])
      newBoard[dropRow][col] = currentValue
      const dropPosition = { row: dropRow, col }

      const { board: resolvedBoard, merges } = resolveChains(newBoard, dropPosition)

      const mergeScore = calculateMergeScore(merges)
      const score = state.score + mergeScore + 1

      let highestTile = state.highestTile
      for (const merge of merges) {
        if (merge.resultValue > highestTile) highestTile = merge.resultValue as MergeValue
      }

      let highScore = state.highScore
      if (score > highScore) {
        highScore = score
        saveHighScore(highScore)
      }

      const nextQueue: [MergeValue, MergeValue, MergeValue] = [
        state.queue[1],
        state.queue[2],
        generateNextValue(score),
      ]

      const gameOver = checkGameOver(resolvedBoard)
      if (gameOver) clearGame()

      return {
        board: resolvedBoard,
        queue: nextQueue,
        score,
        highScore,
        highestTile,
        comboMultiplier: merges.length > 0 ? merges.length : 1,
        totalMerges: state.totalMerges + merges.length,
        gameOver,
        lastMerges: merges.length > 0 ? merges : null,
      }
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

  const placeBlock = useCallback((position: Cell) => {
    dispatch({ type: 'PLACE_BLOCK', position })
  }, [])

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])

  // Auto-save
  useEffect(() => {
    if (!state.gameOver) saveGame(state)
  }, [state])

  return { state, placeBlock, newGame }
}
