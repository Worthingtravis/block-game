import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { GameState, GameAction, Cell } from '../game/types'
import { createEmptyBoard, isValidPlacement, stampPiece, findClears, applyClear, canAnyPieceFit } from '../game/engine'
import { calculatePlacementScore, calculateClearScore, updateCombo } from '../game/scoring'
import { generatePieceSet, generateFairPieceSet } from '../game/pieces'
import { getStateFromUrl, setStateToUrl } from '../game/serialize'

const HIGH_SCORE_KEY = 'block-blast-high-score'

function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY)
    return stored ? parseInt(stored, 10) || 0 : 0
  } catch { return 0 }
}

function saveHighScore(score: number): void {
  try { localStorage.setItem(HIGH_SCORE_KEY, String(score)) } catch { /* localStorage unavailable */ }
}

function stateFromUrl(): GameState | null {
  const url = getStateFromUrl()
  if (!url) return null
  return {
    board: url.board ?? createEmptyBoard(),
    pieces: url.pieces ?? generatePieceSet(),
    score: url.score ?? 0,
    highScore: loadHighScore(),
    comboMultiplier: url.comboMultiplier ?? 1,
    gameOver: false,
    lastClear: null,
  }
}

function freshState(): GameState {
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

export function createInitialState(): GameState {
  return stateFromUrl() ?? freshState()
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

      const comboMultiplier = updateCombo(clears.linesCleared, state.comboMultiplier)
      score += calculateClearScore(clears, comboMultiplier)

      const pieces = [...state.pieces] as [typeof state.pieces[0], typeof state.pieces[1], typeof state.pieces[2]]
      pieces[pieceIndex] = null

      const allPlaced = pieces.every(p => p === null)
      const nextPieces = allPlaced ? generateFairPieceSet(board) : pieces

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
      return {
        board: createEmptyBoard(),
        pieces: generatePieceSet(),
        score: 0,
        highScore: state.highScore,
        comboMultiplier: 1,
        gameOver: false,
        lastClear: null,
      }
    }

    case 'LOAD_STATE': {
      return { ...action.state, highScore: Math.max(state.highScore, action.state.score) }
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
  const loadState = useCallback((s: GameState) => {
    dispatch({ type: 'LOAD_STATE', state: s })
  }, [])

  // Sync state to URL hash — replaceState doesn't fire hashchange, but guard to avoid loops
  const suppressHashChange = useRef(false)
  useEffect(() => {
    suppressHashChange.current = true
    setStateToUrl(state)
    requestAnimationFrame(() => { suppressHashChange.current = false })
  }, [state])

  // Reload from URL when hash changes externally (e.g. pasting a debug URL)
  useEffect(() => {
    const onHashChange = () => {
      if (suppressHashChange.current) return
      const loaded = stateFromUrl()
      if (loaded) dispatch({ type: 'LOAD_STATE', state: loaded })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return { state, placePiece, newGame, loadState }
}
