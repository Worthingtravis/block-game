import { useReducer, useCallback, useEffect, useRef } from 'react'
import type { GameState, GameAction, Cell } from '../game/types'
import { createEmptyBoard, isValidPlacement, stampPiece, findClears, applyClear, applyBomb, canAnyPieceFit } from '../game/engine'
import { calculatePlacementScore, calculateClearScore, updateCombo } from '../game/scoring'
import { generatePieceSet, generateFairPieceSet } from '../game/pieces'
import { getStateFromUrl, setStateToUrl } from '../game/serialize'
import { pieceToStored, createStoredGame, saveGameLocally, loadGameLocally, replayGame } from '../persistence'
import type { StoredGame, StoredMove, StoredPiece } from '../persistence'
import type { GameSyncService } from '../game-sync'

const HIGH_SCORE_KEY = 'block-blast-high-score'
const FLUSH_INTERVAL_MS = 5000

function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY)
    return stored ? parseInt(stored, 10) || 0 : 0
  } catch { return 0 }
}

function saveHighScore(score: number): void {
  try { localStorage.setItem(HIGH_SCORE_KEY, String(score)) } catch { /* */ }
}

function buildGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    pieces: generatePieceSet(),
    score: 0,
    highScore: loadHighScore(),
    comboMultiplier: 1,
    bombs: 0,
    gameOver: false,
    lastClear: null,
    ...overrides,
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

      const comboMultiplier = updateCombo(clears.linesCleared, state.comboMultiplier)
      score += calculateClearScore(clears, comboMultiplier)

      // Award a bomb when combo reaches 4
      const earnedBomb = comboMultiplier >= 4 && state.comboMultiplier < 4
      const bombs = state.bombs + (earnedBomb ? 1 : 0)

      const pieces = [...state.pieces] as [typeof state.pieces[0], typeof state.pieces[1], typeof state.pieces[2]]
      pieces[pieceIndex] = null

      const allPlaced = pieces.every(p => p === null)
      const nextPieces = allPlaced ? generateFairPieceSet(board, score) : pieces

      let highScore = state.highScore
      if (score > highScore) {
        highScore = score
        saveHighScore(highScore)
      }

      const gameOver = !canAnyPieceFit(board, nextPieces)

      return {
        board, pieces: nextPieces, score, highScore, comboMultiplier, bombs, gameOver,
        lastClear: clears.linesCleared > 0 ? clears : null,
      }
    }

    case 'USE_BOMB': {
      if (state.bombs <= 0) return state
      const { position } = action
      const { board, clearResult } = applyBomb(state.board, position)

      let highScore = state.highScore
      const score = state.score
      if (score > highScore) {
        highScore = score
        saveHighScore(highScore)
      }

      const gameOver = !canAnyPieceFit(board, state.pieces)

      return {
        ...state,
        board,
        bombs: state.bombs - 1,
        highScore,
        gameOver,
        lastClear: clearResult.clearedCells.length > 0 ? clearResult : null,
      }
    }

    case 'NEW_GAME': {
      return buildGameState({ highScore: state.highScore })
    }

    case 'LOAD_STATE': {
      return { ...action.state, highScore: Math.max(state.highScore, action.state.score) }
    }

    default:
      return state
  }
}

export function createFreshState(): GameState {
  return buildGameState()
}

function createInitialState(): { state: GameState; game: StoredGame } {
  const saved = loadGameLocally()
  if (saved && saved.status === 'in_progress') {
    const state = replayGame(saved, loadHighScore())
    if (!state.gameOver) {
      return { state, game: saved }
    }
  }

  const urlState = getStateFromUrl()
  if (urlState) {
    const state = buildGameState({
      board: urlState.board ?? undefined,
      pieces: urlState.pieces ?? undefined,
      score: urlState.score ?? undefined,
      comboMultiplier: urlState.comboMultiplier ?? undefined,
    })
    return { state, game: createStoredGame(state.pieces, state.score) }
  }

  const state = buildGameState()
  return { state, game: createStoredGame(state.pieces) }
}

const _initial = createInitialState()

type UseGameStateOptions = {
  syncService?: GameSyncService | null
}

export function useGameState(opts?: UseGameStateOptions) {
  const [state, dispatch] = useReducer(gameReducer, _initial.state)
  const gameRef = useRef<StoredGame>(_initial.game)
  const lastFlushedRef = useRef(0)
  const syncRef = useRef(opts?.syncService ?? null)
  useEffect(() => { syncRef.current = opts?.syncService ?? null }, [opts?.syncService])

  // Capture move metadata at dispatch time so we don't need to reverse-engineer it from state diffs
  const pendingMoveRef = useRef<{ pieceIndex: number; position: Cell } | null>(null)

  const didLoadFromDb = useRef(false)
  useEffect(() => {
    if (didLoadFromDb.current) return
    didLoadFromDb.current = true
    const sync = syncRef.current
    if (!sync) return

    sync.loadActiveGame().then(dbGame => {
      if (!dbGame || dbGame.status !== 'in_progress') return
      const dbState = replayGame(dbGame, loadHighScore())
      if (dbGame.moves.length > gameRef.current.moves.length) {
        gameRef.current = dbGame
        lastFlushedRef.current = dbGame.moves.length
        dispatch({ type: 'LOAD_STATE', state: dbState })
        saveGameLocally(dbGame)
      }
    })
  }, [])

  const placePiece = useCallback((pieceIndex: number, position: Cell) => {
    pendingMoveRef.current = { pieceIndex, position }
    dispatch({ type: 'PLACE_PIECE', pieceIndex, position })
  }, [])

  const useBomb = useCallback((position: Cell) => {
    dispatch({ type: 'USE_BOMB', position })
  }, [])

  const newGame = useCallback(() => {
    const sync = syncRef.current
    if (gameRef.current.status === 'in_progress') {
      gameRef.current.status = 'abandoned'
      saveGameLocally(gameRef.current)
      sync?.endGame(gameRef.current.id, gameRef.current.score, 'abandoned')
    }
    dispatch({ type: 'NEW_GAME' })
  }, [])

  const loadState = useCallback((s: GameState) => {
    dispatch({ type: 'LOAD_STATE', state: s })
  }, [])

  const prevStateRef = useRef(state)
  useEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = state
    const sync = syncRef.current

    // New game started (reducer returned fresh state)
    if (state.score === 0 && state.comboMultiplier === 1 && prev !== state && prev.score > 0) {
      gameRef.current = createStoredGame(state.pieces)
      lastFlushedRef.current = 0
      saveGameLocally(gameRef.current)
      sync?.saveGame(gameRef.current)
      return
    }

    // Piece placed — use captured metadata instead of reverse-engineering
    const pending = pendingMoveRef.current
    if (pending && state.board !== prev.board) {
      pendingMoveRef.current = null
      const moveNumber = gameRef.current.moves.length
      const allPlacedBefore = prev.pieces.filter(p => p !== null).length === 1
      const nextPieces = allPlacedBefore ? state.pieces.map(pieceToStored) as StoredPiece[] : null

      const move: StoredMove = {
        move_number: moveNumber,
        piece_index: pending.pieceIndex,
        position_row: pending.position.row,
        position_col: pending.position.col,
        next_pieces: nextPieces,
      }

      gameRef.current.moves.push(move)
      gameRef.current.score = state.score
      saveGameLocally(gameRef.current)

      if (state.gameOver) {
        gameRef.current.status = 'game_over'
        const unflushed = gameRef.current.moves.slice(lastFlushedRef.current)
        lastFlushedRef.current = gameRef.current.moves.length
        sync?.flushMoves(gameRef.current.id, unflushed)
        sync?.endGame(gameRef.current.id, state.score, 'game_over')
        saveGameLocally(gameRef.current)
      }
    }
  }, [state])

  // Periodic flush of unflushed moves to DB
  useEffect(() => {
    const interval = setInterval(() => {
      const sync = syncRef.current
      if (!sync || gameRef.current.status !== 'in_progress') return
      const unflushed = gameRef.current.moves.slice(lastFlushedRef.current)
      if (unflushed.length === 0) return
      lastFlushedRef.current = gameRef.current.moves.length
      sync.flushMoves(gameRef.current.id, unflushed)
    }, FLUSH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  // URL hash sync
  const suppressHashChange = useRef(false)
  useEffect(() => {
    suppressHashChange.current = true
    setStateToUrl(state)
    requestAnimationFrame(() => { suppressHashChange.current = false })
  }, [state])

  useEffect(() => {
    const onHashChange = () => {
      if (suppressHashChange.current) return
      const urlState = getStateFromUrl()
      if (urlState) {
        dispatch({ type: 'LOAD_STATE', state: buildGameState({
          board: urlState.board ?? undefined,
          pieces: urlState.pieces ?? undefined,
          score: urlState.score ?? undefined,
          comboMultiplier: urlState.comboMultiplier ?? undefined,
        }) })
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return { state, placePiece, useBomb, newGame, loadState }
}
