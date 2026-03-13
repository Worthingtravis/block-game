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
  try { localStorage.setItem(HIGH_SCORE_KEY, String(score)) } catch {}
}

export function createInitialState(): GameState {
  const urlState = getStateFromUrl()
  if (urlState) {
    console.log('[block-game] Loaded state from URL hash', {
      filledCells: urlState.board?.flat().filter(c => c !== null).length,
      pieces: urlState.pieces?.map(p => p ? `${p.shape}:${p.color}` : '_'),
    })
    return {
      board: urlState.board ?? createEmptyBoard(),
      pieces: urlState.pieces ?? generatePieceSet(),
      score: urlState.score ?? 0,
      highScore: loadHighScore(),
      comboMultiplier: urlState.comboMultiplier ?? 1,
      gameOver: false,
      lastClear: null,
    }
  }
  console.log('[block-game] Fresh game (no URL hash found)')
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
      return { ...createInitialState(), highScore: state.highScore }
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

  // Sync state to URL hash so it can be shared/bookmarked.
  // Use replaceState (doesn't fire hashchange) to avoid loops.
  const suppressHashChange = useRef(false)
  useEffect(() => {
    suppressHashChange.current = true
    setStateToUrl(state)
    // replaceState doesn't fire hashchange, but guard just in case
    requestAnimationFrame(() => { suppressHashChange.current = false })
  }, [state])

  // Listen for hash changes (e.g. pasting a debug URL while page is open)
  useEffect(() => {
    const onHashChange = () => {
      if (suppressHashChange.current) return
      const urlState = getStateFromUrl()
      if (urlState) {
        dispatch({
          type: 'LOAD_STATE',
          state: {
            board: urlState.board ?? createEmptyBoard(),
            pieces: urlState.pieces ?? generatePieceSet(),
            score: urlState.score ?? 0,
            highScore: loadHighScore(),
            comboMultiplier: urlState.comboMultiplier ?? 1,
            gameOver: false,
            lastClear: null,
          },
        })
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return { state, placePiece, newGame, loadState }
}
