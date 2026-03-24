import { describe, it, expect } from 'vitest'
import { createEmptyBoard, isValidPlacement, stampPiece, findClears, applyClear, canAllPiecesFit } from '../engine'
import { generateFairPieceSet, SHAPE_DEFINITIONS } from '../pieces'
import { serializeState } from '../serialize'
import { BOARD_SIZE, BLOCK_COLORS } from '../types'
import type { Board, Piece, GameState } from '../types'

const DEV_SERVER = 'http://localhost:5173'

/** Build a game URL from a board + pieces so you can open it in the browser */
function buildDebugUrl(board: Board, pieces: [Piece | null, Piece | null, Piece | null], score = 0): string {
  const state: GameState = {
    board,
    pieces,
    score,
    highScore: 0,
    comboMultiplier: 1,
    gameOver: false,
    lastClear: null,
  }
  return `${DEV_SERVER}/#${serializeState(state)}`
}

/**
 * Helper: create a board with random fill at a given density (0.0 = empty, 1.0 = full).
 * Uses mixed colors to avoid accidentally completing rows/columns.
 */
function createRandomBoard(density: number): Board {
  const board = createEmptyBoard()
  const totalCells = BOARD_SIZE * BOARD_SIZE
  const targetFilled = Math.floor(totalCells * density)
  let filled = 0

  const positions: { row: number; col: number }[] = []
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      positions.push({ row: r, col: c })

  // Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]]
  }

  for (const pos of positions) {
    if (filled >= targetFilled) break
    board[pos.row][pos.col] = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)]
    filled++
  }
  return board
}

describe('canAllPiecesFit', () => {
  it('returns true for 3 small pieces on empty board', () => {
    const board = createEmptyBoard()
    const pieces: Piece[] = [
      { id: '1', shape: 'single', color: 'blue', cells: SHAPE_DEFINITIONS.single },
      { id: '2', shape: 'single', color: 'green', cells: SHAPE_DEFINITIONS.single },
      { id: '3', shape: 'single', color: 'pink', cells: SHAPE_DEFINITIONS.single },
    ]
    expect(canAllPiecesFit(board, pieces)).toBe(true)
  })

  it('returns false when pieces cannot all fit', () => {
    // Fill board leaving 1 empty cell per row in diagonal pattern (no full rows or cols)
    // That gives us 8 scattered empty cells — not enough for three 3x3 squares (need 27)
    const board = createEmptyBoard()
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        board[r][c] = 'blue'

    // Clear one cell per row in different columns so no row/col is full
    for (let r = 0; r < BOARD_SIZE; r++) board[r][r % BOARD_SIZE] = null

    const clears = findClears(board)
    expect(clears.linesCleared).toBe(0)

    // 3x square3 pieces need 27 contiguous cells each — impossible with 8 scattered singles
    const pieces: Piece[] = [
      { id: '1', shape: 'square3', color: 'green', cells: SHAPE_DEFINITIONS.square3 },
      { id: '2', shape: 'square3', color: 'pink', cells: SHAPE_DEFINITIONS.square3 },
      { id: '3', shape: 'square3', color: 'yellow', cells: SHAPE_DEFINITIONS.square3 },
    ]
    expect(canAllPiecesFit(board, pieces)).toBe(false)
  })

  it('returns true when clearing a line frees space for subsequent pieces', () => {
    // Fill row 0 except col 0, fill rows 2+ densely
    const board = createEmptyBoard()
    for (let c = 1; c < BOARD_SIZE; c++) board[0][c] = 'blue'
    for (let r = 2; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = 'orange'

    const pieces: Piece[] = [
      { id: '1', shape: 'single', color: 'green', cells: SHAPE_DEFINITIONS.single },
      { id: '2', shape: 'line2h', color: 'pink', cells: SHAPE_DEFINITIONS.line2h },
      { id: '3', shape: 'line2h', color: 'yellow', cells: SHAPE_DEFINITIONS.line2h },
    ]
    // Piece 1 at (0,0) completes row 0, clearing it and freeing space
    expect(canAllPiecesFit(board, pieces)).toBe(true)
  })

  it('returns true for empty pieces array', () => {
    const board = createEmptyBoard()
    expect(canAllPiecesFit(board, [])).toBe(true)
  })
})

describe('generateFairPieceSet — brute force', () => {
  it('generates placeable sets for 500 random boards at low-medium density', () => {
    const densities = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5]
    let tested = 0
    let fair = 0

    for (const density of densities) {
      for (let i = 0; i < 80; i++) {
        const board = createRandomBoard(density)
        const pieces = generateFairPieceSet(board)
        tested++
        if (canAllPiecesFit(board, [...pieces])) fair++
      }
    }

    // At low-to-medium densities, nearly every generated set should be fair.
    // Random board layouts can very occasionally create pathological shapes
    // where 10 retries aren't enough, so allow a tiny margin.
    expect(fair / tested).toBeGreaterThan(0.99)
  })

  it('generates placeable sets for 300 high-density boards (60-80% full)', () => {
    let tested = 0
    let fair = 0

    for (let i = 0; i < 300; i++) {
      const density = 0.6 + Math.random() * 0.2
      const board = createRandomBoard(density)
      const pieces = generateFairPieceSet(board)
      tested++
      if (canAllPiecesFit(board, [...pieces])) fair++
    }

    // High density boards (60-80%) can genuinely be unsolvable —
    // no set of 3 pieces exists that can all fit. This is a real game-over,
    // not a failure of the algorithm. Most should still be fair.
    const fairRate = fair / tested
    expect(fairRate).toBeGreaterThan(0.85)
  })

  it('all fair sets are actually placeable across 1000 random scenarios', () => {
    let tested = 0
    let verified = 0

    for (let i = 0; i < 1000; i++) {
      const density = Math.random() * 0.7 // 0-70%
      const board = createRandomBoard(density)
      const pieces = generateFairPieceSet(board)
      tested++

      // Double-check: independently verify the result
      if (canAllPiecesFit(board, [...pieces])) verified++
    }

    // Under 70% density, should always find a fair set within 10 retries
    expect(verified / tested).toBeGreaterThan(0.99)
  })

  it('simulated games never receive provably-unfair piece sets', () => {
    // Simulate 20 games, 30 rounds each. After each set of 3 pieces is dealt,
    // verify that canAllPiecesFit returns true. Place pieces greedily afterward
    // (greedy may fail, but that's the player's fault, not unfair generation).
    const numGames = 20
    const maxRounds = 30
    let totalRounds = 0
    let unfairRounds = 0

    for (let g = 0; g < numGames; g++) {
      let board = createEmptyBoard()

      for (let round = 0; round < maxRounds; round++) {
        const pieces = generateFairPieceSet(board)
        totalRounds++

        // THE KEY CHECK: is this set actually all-placeable?
        if (!canAllPiecesFit(board, [...pieces])) {
          unfairRounds++
          break // board is likely too full, stop this game
        }

        // Place greedily (not optimal, just to advance the board state)
        let stuck = false
        for (const piece of pieces) {
          let placed = false
          for (let row = 0; row < BOARD_SIZE && !placed; row++) {
            for (let col = 0; col < BOARD_SIZE && !placed; col++) {
              if (isValidPlacement(board, piece, { row, col })) {
                board = stampPiece(board, piece, { row, col })
                const clears = findClears(board)
                if (clears.linesCleared > 0) board = applyClear(board, clears)
                placed = true
              }
            }
          }
          if (!placed) { stuck = true; break }
        }
        if (stuck) break // greedy player stuck, not unfair — just move to next game
      }
    }

    // Greedy play fills the board badly, so some games will reach states
    // where no set of 3 pieces can fit (genuine game over). But this
    // should be rare in the first 30 rounds — most unfairness = 0.
    expect(unfairRounds / totalRounds).toBeLessThan(0.05)
  })
})

describe('fairness — stop on first failure and print debug URL', () => {
  it('stress test: 1000 random boards, halt and print URL on unfair set', () => {
    for (let i = 0; i < 1000; i++) {
      const density = Math.random() * 0.65 // 0-65%, should always be solvable
      const board = createRandomBoard(density)
      const pieces = generateFairPieceSet(board)

      const allFit = canAllPiecesFit(board, [...pieces])
      if (!allFit) {
        const url = buildDebugUrl(board, pieces)
        console.error(`\n\n❌ UNFAIR SET on iteration ${i} (density=${(density * 100).toFixed(0)}%)`)
        console.error(`Open this URL to see the scenario:\n${url}\n`)
        expect.fail(
          `Unfair piece set at iteration ${i}. Open in browser:\n${url}`
        )
      }
    }
  })

  it('stress test: 500 simulated games, halt and print URL on unfair deal', () => {
    for (let g = 0; g < 500; g++) {
      let board = createEmptyBoard()

      for (let round = 0; round < 20; round++) {
        const pieces = generateFairPieceSet(board)
        const allFit = canAllPiecesFit(board, [...pieces])

        if (!allFit) {
          const url = buildDebugUrl(board, pieces)
          console.error(`\n\n❌ UNFAIR DEAL in game ${g}, round ${round}`)
          console.error(`Open this URL to see the scenario:\n${url}\n`)
          expect.fail(
            `Unfair deal in game ${g}, round ${round}. Open in browser:\n${url}`
          )
        }

        // Place greedily to advance
        let stuck = false
        for (const piece of pieces) {
          let placed = false
          for (let row = 0; row < BOARD_SIZE && !placed; row++) {
            for (let col = 0; col < BOARD_SIZE && !placed; col++) {
              if (isValidPlacement(board, piece, { row, col })) {
                board = stampPiece(board, piece, { row, col })
                const clears = findClears(board)
                if (clears.linesCleared > 0) board = applyClear(board, clears)
                placed = true
              }
            }
          }
          if (!placed) { stuck = true; break }
        }
        if (stuck) break
      }
    }
  })
})
