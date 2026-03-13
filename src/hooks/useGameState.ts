import { useReducer, useCallback } from 'react'
import type { GameState, GameAction, Cell } from '../game/types'
import { createEmptyBoard, isValidPlacement, stampPiece, findClears, applyClear, canAnyPieceFit } from '../game/engine'
import { calculatePlacementScore, calculateClearScore, updateCombo } from '../game/scoring'
import { generatePieceSet } from '../game/pieces'

const HIGH_SCORE_KEY = 'block-blast-high-score'

function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY)
    return stored ? parseInt(stored, 10) || 0 : 0
  } catch { return 0 }
}

function saveHighScore(score: number): void {
  try { localStorage.setItem(HIGH_SCORE_KEY, String(score)) } catch {}
}

export function createInitialState(): GameState {
  return {
    board: createEmptyBoard(),
    pieces: generatePieceSet(),
    score: 0,
    highScore: loadHighScore(),
    comboMultiplier: 1,
    gameOver: false,
    lastClear: null,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_PIECE': {
      const { pieceIndex, position } = action
      const piece = state.pieces[pieceIndex]
      if (!piece) return state
      if (!isValidPlacement(state.board, piece, position)) return state

      let board = stampPiece(state.board, piece, position)
      let score = state.score + calculatePlacementScore(piece.cells.length)

      const clears = findClears(board)
      if (clears.linesCleared > 0) {
        board = applyClear(board, clears)
      }

      score += calculateClearScore(clears.linesCleared, state.comboMultiplier)
      const comboMultiplier = updateCombo(clears.linesCleared, state.comboMultiplier)

      const pieces = [...state.pieces] as [typeof state.pieces[0], typeof state.pieces[1], typeof state.pieces[2]]
      pieces[pieceIndex] = null

      const allPlaced = pieces.every(p => p === null)
      const nextPieces = allPlaced ? generatePieceSet() : pieces

      let highScore = state.highScore
      if (score > highScore) {
        highScore = score
        saveHighScore(highScore)
      }

      const gameOver = !canAnyPieceFit(board, nextPieces)

      return {
        board, pieces: nextPieces, score, highScore, comboMultiplier, gameOver,
        lastClear: clears.linesCleared > 0 ? clears : null,
      }
    }

    case 'NEW_GAME': {
      return { ...createInitialState(), highScore: state.highScore }
    }

    default:
      return state
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const placePiece = useCallback((pieceIndex: number, position: Cell) => {
    dispatch({ type: 'PLACE_PIECE', pieceIndex, position })
  }, [])
  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' })
  }, [])
  return { state, placePiece, newGame }
}
