# Block Blast Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Block Blast puzzle game with glossy 3D visuals, combo scoring, and full juice (particles, screen shake, synthesized audio).

**Architecture:** React + TypeScript SPA. Pure game logic in `src/game/` (no React dependency), React components in `src/components/`, custom hooks bridge logic to UI. CSS renders the grid and 3D blocks, a canvas overlay handles particles only, Web Audio API synthesizes all sounds.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, CSS (no external animation/game libraries)

**Spec:** `docs/superpowers/specs/2026-03-13-block-blast-design.md`

---

## Chunk 1: Project Scaffold + Types + Piece Definitions

### Task 1: Initialize Vite + React + TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/index.tsx`, `src/components/App.tsx`, `src/styles/index.css`

- [ ] **Step 1: Scaffold the project with Vite**

```bash
cd ~/development/block-game
npm create vite@latest . -- --template react-ts
```

Select: React, TypeScript

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Add Vitest and jsdom for testing**

```bash
npm install -D vitest jsdom
```

- [ ] **Step 4: Add test script to package.json**

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify the dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts on localhost, default React page renders.

- [ ] **Step 6: Clean up default Vite files**

Remove default Vite boilerplate content from `src/App.tsx`, `src/App.css`, `src/index.css`. Replace `src/App.tsx` with:

```tsx
export default function App() {
  return <div className="game-container">Block Blast</div>
}
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html src/ eslint.config.js public/
git commit -m "chore: scaffold Vite + React + TypeScript project with Vitest"
```

Also configure Vitest in `vite.config.ts`:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
```

---

### Task 2: Define types and constants

**Files:**
- Create: `src/game/types.ts`
- Test: `src/game/__tests__/types.test.ts`

- [ ] **Step 1: Write the types file**

Create `src/game/types.ts`:

```typescript
export const BOARD_SIZE = 10

export const BLOCK_COLORS = ['purple', 'orange', 'yellow', 'green', 'gray', 'blue', 'pink'] as const
export type BlockColor = (typeof BLOCK_COLORS)[number]

export type ShapeType =
  | 'single'
  | 'line2h' | 'line2v'
  | 'line3h' | 'line3v'
  | 'line4h' | 'line4v'
  | 'line5h' | 'line5v'
  | 'square2' | 'square3'
  | 'L1' | 'L2' | 'L3' | 'L4'
  | 'T1' | 'T2' | 'T3' | 'T4'
  | 'Z1' | 'Z2' | 'S1' | 'S2'

export type Cell = { row: number; col: number }

export type Piece = {
  id: string
  shape: ShapeType
  color: BlockColor
  cells: readonly Cell[]
}

export type Board = (BlockColor | null)[][]

export type GameState = {
  board: Board
  pieces: [Piece | null, Piece | null, Piece | null]
  score: number
  highScore: number
  comboMultiplier: number
  gameOver: boolean
}

export type DragState = {
  draggedPieceIndex: number | null
  hoverPosition: Cell | null
  placementValidity: boolean | null
}

export type ClearResult = {
  clearedRows: number[]
  clearedCols: number[]
  clearedCells: Cell[]
  linesCleared: number
}

export type GameAction =
  | { type: 'PLACE_PIECE'; pieceIndex: number; position: Cell }
  | { type: 'NEW_GAME' }
```

- [ ] **Step 2: Write a basic type validation test**

Create `src/game/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { BOARD_SIZE, BLOCK_COLORS } from '../types'

describe('constants', () => {
  it('BOARD_SIZE is 10', () => {
    expect(BOARD_SIZE).toBe(10)
  })

  it('has 7 block colors', () => {
    expect(BLOCK_COLORS).toHaveLength(7)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/game/types.ts src/game/__tests__/types.test.ts
git commit -m "feat: add game types and constants"
```

---

### Task 3: Define all piece shapes

**Files:**
- Create: `src/game/pieces.ts`
- Test: `src/game/__tests__/pieces.test.ts`

- [ ] **Step 1: Write failing tests for piece definitions**

Create `src/game/__tests__/pieces.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { SHAPE_DEFINITIONS, generatePiece, generatePieceSet } from '../pieces'
import type { ShapeType } from '../types'
import { BLOCK_COLORS } from '../types'

describe('SHAPE_DEFINITIONS', () => {
  it('contains all 21 shape types', () => {
    expect(Object.keys(SHAPE_DEFINITIONS)).toHaveLength(21)
  })

  it('single is a 1x1 block', () => {
    expect(SHAPE_DEFINITIONS.single).toEqual([{ row: 0, col: 0 }])
  })

  it('line5h is a horizontal 5-block line', () => {
    expect(SHAPE_DEFINITIONS.line5h).toEqual([
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
      { row: 0, col: 3 }, { row: 0, col: 4 },
    ])
  })

  it('line5v is a vertical 5-block line', () => {
    expect(SHAPE_DEFINITIONS.line5v).toEqual([
      { row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 },
      { row: 3, col: 0 }, { row: 4, col: 0 },
    ])
  })

  it('square2 is a 2x2 block', () => {
    expect(SHAPE_DEFINITIONS.square2).toEqual([
      { row: 0, col: 0 }, { row: 0, col: 1 },
      { row: 1, col: 0 }, { row: 1, col: 1 },
    ])
  })

  it('all cells are non-negative', () => {
    for (const [, cells] of Object.entries(SHAPE_DEFINITIONS)) {
      for (const cell of cells) {
        expect(cell.row).toBeGreaterThanOrEqual(0)
        expect(cell.col).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('all shapes start at origin (0,0 is occupied)', () => {
    for (const [, cells] of Object.entries(SHAPE_DEFINITIONS)) {
      const minRow = Math.min(...cells.map(c => c.row))
      const minCol = Math.min(...cells.map(c => c.col))
      expect(minRow).toBe(0)
      expect(minCol).toBe(0)
    }
  })
})

describe('generatePiece', () => {
  it('returns a piece with a valid id, shape, color, and cells', () => {
    const piece = generatePiece()
    expect(piece.id).toBeTruthy()
    expect(BLOCK_COLORS).toContain(piece.color)
    expect(piece.cells.length).toBeGreaterThan(0)
  })
})

describe('generatePieceSet', () => {
  it('returns exactly 3 pieces', () => {
    const pieces = generatePieceSet()
    expect(pieces).toHaveLength(3)
    pieces.forEach(p => {
      expect(p).not.toBeNull()
      expect(p!.id).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement piece definitions**

Create `src/game/pieces.ts`:

```typescript
import type { Cell, Piece, ShapeType, BlockColor } from './types'
import { BLOCK_COLORS } from './types'

export const SHAPE_DEFINITIONS: Record<ShapeType, readonly Cell[]> = {
  // Singles
  single: [{ row: 0, col: 0 }],

  // Lines horizontal
  line2h: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
  line3h: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
  line4h: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
  line5h: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }],

  // Lines vertical
  line2v: [{ row: 0, col: 0 }, { row: 1, col: 0 }],
  line3v: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
  line4v: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }],
  line5v: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }, { row: 4, col: 0 }],

  // Squares
  square2: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
  ],
  square3: [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
    { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
  ],

  // L-shapes (4 mirror variants)
  L1: [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 2, col: 0 }, { row: 2, col: 1 },
  ],
  L2: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 2, col: 0 },
  ],
  L3: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
                         { row: 1, col: 1 },
                         { row: 2, col: 1 },
  ],
  L4: [
                         { row: 0, col: 1 },
                         { row: 1, col: 1 },
    { row: 2, col: 0 }, { row: 2, col: 1 },
  ],

  // T-shapes (4 orientations)
  T1: [
    { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
                         { row: 1, col: 1 },
  ],
  T2: [
    { row: 0, col: 0 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
    { row: 2, col: 0 },
  ],
  T3: [
                         { row: 0, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
  ],
  T4: [
                         { row: 0, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
                         { row: 2, col: 1 },
  ],

  // Z and S shapes
  Z1: [
    { row: 0, col: 0 }, { row: 0, col: 1 },
                         { row: 1, col: 1 }, { row: 1, col: 2 },
  ],
  Z2: [
                         { row: 0, col: 1 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
    { row: 2, col: 0 },
  ],
  S1: [
                         { row: 0, col: 1 }, { row: 0, col: 2 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
  ],
  S2: [
    { row: 0, col: 0 },
    { row: 1, col: 0 }, { row: 1, col: 1 },
                         { row: 2, col: 1 },
  ],
}

const ALL_SHAPES = Object.keys(SHAPE_DEFINITIONS) as ShapeType[]

function randomColor(): BlockColor {
  return BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)]
}

function randomShape(): ShapeType {
  return ALL_SHAPES[Math.floor(Math.random() * ALL_SHAPES.length)]
}

export function generatePiece(): Piece {
  const shape = randomShape()
  return {
    id: crypto.randomUUID(),
    shape,
    color: randomColor(),
    cells: SHAPE_DEFINITIONS[shape],
  }
}

export function generatePieceSet(): [Piece, Piece, Piece] {
  return [generatePiece(), generatePiece(), generatePiece()]
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All piece tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/pieces.ts src/game/__tests__/pieces.test.ts
git commit -m "feat: define all 21 piece shapes with generation functions"
```

---

## Chunk 2: Core Game Engine (Pure Logic)

### Task 4: Board utilities — create, validate placement, stamp piece

**Files:**
- Create: `src/game/engine.ts`
- Test: `src/game/__tests__/engine.test.ts`

- [ ] **Step 1: Write failing tests for board utilities**

Create `src/game/__tests__/engine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createEmptyBoard, isValidPlacement, stampPiece } from '../engine'
import { BOARD_SIZE } from '../types'
import type { Piece, Board } from '../types'

const testPiece: Piece = {
  id: 'test-1',
  shape: 'line3h',
  color: 'blue',
  cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
}

describe('createEmptyBoard', () => {
  it('creates a 10x10 board of nulls', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(BOARD_SIZE)
    board.forEach(row => {
      expect(row).toHaveLength(BOARD_SIZE)
      row.forEach(cell => expect(cell).toBeNull())
    })
  })
})

describe('isValidPlacement', () => {
  it('returns true for valid placement on empty board', () => {
    const board = createEmptyBoard()
    expect(isValidPlacement(board, testPiece, { row: 0, col: 0 })).toBe(true)
  })

  it('returns true for placement at bottom-right that fits', () => {
    const board = createEmptyBoard()
    expect(isValidPlacement(board, testPiece, { row: 9, col: 7 })).toBe(true)
  })

  it('returns false when piece goes out of bounds (right)', () => {
    const board = createEmptyBoard()
    expect(isValidPlacement(board, testPiece, { row: 0, col: 8 })).toBe(false)
  })

  it('returns false when piece goes out of bounds (bottom)', () => {
    const board = createEmptyBoard()
    const vertPiece: Piece = {
      id: 'test-v',
      shape: 'line3v',
      color: 'green',
      cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
    }
    expect(isValidPlacement(board, vertPiece, { row: 8, col: 0 })).toBe(false)
  })

  it('returns false when cell is already occupied', () => {
    const board = createEmptyBoard()
    board[0][1] = 'orange'
    expect(isValidPlacement(board, testPiece, { row: 0, col: 0 })).toBe(false)
  })
})

describe('stampPiece', () => {
  it('places piece cells on the board', () => {
    const board = createEmptyBoard()
    const newBoard = stampPiece(board, testPiece, { row: 2, col: 3 })
    expect(newBoard[2][3]).toBe('blue')
    expect(newBoard[2][4]).toBe('blue')
    expect(newBoard[2][5]).toBe('blue')
    // Original board unchanged
    expect(board[2][3]).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — functions not found.

- [ ] **Step 3: Implement board utilities**

Create `src/game/engine.ts`:

```typescript
import type { Board, Cell, Piece, ClearResult } from './types'
import { BOARD_SIZE } from './types'

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  )
}

export function isValidPlacement(board: Board, piece: Piece, position: Cell): boolean {
  for (const cell of piece.cells) {
    const row = position.row + cell.row
    const col = position.col + cell.col
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false
    if (board[row][col] !== null) return false
  }
  return true
}

export function stampPiece(board: Board, piece: Piece, position: Cell): Board {
  const newBoard = board.map(row => [...row])
  for (const cell of piece.cells) {
    newBoard[position.row + cell.row][position.col + cell.col] = piece.color
  }
  return newBoard
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/engine.ts src/game/__tests__/engine.test.ts
git commit -m "feat: add board creation, placement validation, and piece stamping"
```

---

### Task 5: Line clearing — detect and clear full rows/columns

**Files:**
- Modify: `src/game/engine.ts`
- Modify: `src/game/__tests__/engine.test.ts`

- [ ] **Step 1: Write failing tests for line clearing**

Append to `src/game/__tests__/engine.test.ts`:

```typescript
import { findClears, applyClear } from '../engine'

describe('findClears', () => {
  it('returns empty result when no lines are full', () => {
    const board = createEmptyBoard()
    const result = findClears(board)
    expect(result.linesCleared).toBe(0)
    expect(result.clearedCells).toEqual([])
  })

  it('detects a full row', () => {
    const board = createEmptyBoard()
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[3][col] = 'blue'
    }
    const result = findClears(board)
    expect(result.clearedRows).toEqual([3])
    expect(result.clearedCols).toEqual([])
    expect(result.linesCleared).toBe(1)
    expect(result.clearedCells).toHaveLength(BOARD_SIZE)
  })

  it('detects a full column', () => {
    const board = createEmptyBoard()
    for (let row = 0; row < BOARD_SIZE; row++) {
      board[row][5] = 'green'
    }
    const result = findClears(board)
    expect(result.clearedRows).toEqual([])
    expect(result.clearedCols).toEqual([5])
    expect(result.linesCleared).toBe(1)
  })

  it('detects row and column simultaneously with deduplicated cells', () => {
    const board = createEmptyBoard()
    // Fill row 3
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[3][col] = 'blue'
    }
    // Fill col 5
    for (let row = 0; row < BOARD_SIZE; row++) {
      board[row][5] = 'green'
    }
    const result = findClears(board)
    expect(result.clearedRows).toEqual([3])
    expect(result.clearedCols).toEqual([5])
    expect(result.linesCleared).toBe(2)
    // 10 + 10 - 1 intersection = 19 unique cells
    expect(result.clearedCells).toHaveLength(19)
  })
})

describe('applyClear', () => {
  it('sets cleared cells to null', () => {
    const board = createEmptyBoard()
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[0][col] = 'purple'
    }
    const clears = findClears(board)
    const newBoard = applyClear(board, clears)
    for (let col = 0; col < BOARD_SIZE; col++) {
      expect(newBoard[0][col]).toBeNull()
    }
    // Original unchanged
    expect(board[0][0]).toBe('purple')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `findClears` and `applyClear` not found.

- [ ] **Step 3: Implement line clearing**

Add to `src/game/engine.ts`:

```typescript
export function findClears(board: Board): ClearResult {
  const clearedRows: number[] = []
  const clearedCols: number[] = []

  for (let row = 0; row < BOARD_SIZE; row++) {
    if (board[row].every(cell => cell !== null)) {
      clearedRows.push(row)
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    let full = true
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (board[row][col] === null) { full = false; break }
    }
    if (full) clearedCols.push(col)
  }

  const cellSet = new Set<string>()
  const clearedCells: Cell[] = []

  for (const row of clearedRows) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row},${col}`
      if (!cellSet.has(key)) {
        cellSet.add(key)
        clearedCells.push({ row, col })
      }
    }
  }

  for (const col of clearedCols) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      const key = `${row},${col}`
      if (!cellSet.has(key)) {
        cellSet.add(key)
        clearedCells.push({ row, col })
      }
    }
  }

  return {
    clearedRows,
    clearedCols,
    clearedCells,
    linesCleared: clearedRows.length + clearedCols.length,
  }
}

export function applyClear(board: Board, clearResult: ClearResult): Board {
  const newBoard = board.map(row => [...row])
  for (const { row, col } of clearResult.clearedCells) {
    newBoard[row][col] = null
  }
  return newBoard
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/engine.ts src/game/__tests__/engine.test.ts
git commit -m "feat: add line detection and clearing (rows + columns simultaneously)"
```

---

### Task 6: Scoring logic

**Files:**
- Create: `src/game/scoring.ts`
- Test: `src/game/__tests__/scoring.test.ts`

- [ ] **Step 1: Write failing tests for scoring**

Create `src/game/__tests__/scoring.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculatePlacementScore, calculateClearScore, updateCombo } from '../scoring'

describe('calculatePlacementScore', () => {
  it('returns 1 point per block', () => {
    expect(calculatePlacementScore(1)).toBe(1)
    expect(calculatePlacementScore(5)).toBe(5)
    expect(calculatePlacementScore(9)).toBe(9)
  })
})

describe('calculateClearScore', () => {
  it('returns 0 for 0 lines cleared', () => {
    expect(calculateClearScore(0, 1)).toBe(0)
  })

  it('returns 10 for 1 line with combo 1', () => {
    expect(calculateClearScore(1, 1)).toBe(10)
  })

  it('returns 40 for 2 lines with combo 1', () => {
    expect(calculateClearScore(2, 1)).toBe(40)
  })

  it('applies combo multiplier', () => {
    // 2 lines, combo 3: 10 * 4 * 3 = 120
    expect(calculateClearScore(2, 3)).toBe(120)
  })

  it('matches spec example: 2 lines, combo 3 = 120', () => {
    expect(calculateClearScore(2, 3)).toBe(120)
  })
})

describe('updateCombo', () => {
  it('increments combo when lines were cleared', () => {
    expect(updateCombo(1, 1)).toBe(2)
    expect(updateCombo(1, 3)).toBe(4)
  })

  it('resets combo to 1 when no lines cleared', () => {
    expect(updateCombo(0, 5)).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement scoring**

Create `src/game/scoring.ts`:

```typescript
export function calculatePlacementScore(blockCount: number): number {
  return blockCount
}

export function calculateClearScore(linesCleared: number, comboMultiplier: number): number {
  if (linesCleared === 0) return 0
  return 10 * linesCleared * linesCleared * comboMultiplier
}

export function updateCombo(linesCleared: number, currentCombo: number): number {
  return linesCleared >= 1 ? currentCombo + 1 : 1
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts src/game/__tests__/scoring.test.ts
git commit -m "feat: add scoring logic with combo multiplier"
```

---

### Task 7: Game-over detection — canAnyPieceFit

**Files:**
- Modify: `src/game/engine.ts`
- Modify: `src/game/__tests__/engine.test.ts`

- [ ] **Step 1: Write failing tests for game-over detection**

Append to `src/game/__tests__/engine.test.ts`:

```typescript
import { canAnyPieceFit } from '../engine'
import type { Piece } from '../types'

describe('canAnyPieceFit', () => {
  it('returns true when board is empty', () => {
    const board = createEmptyBoard()
    const piece: Piece = {
      id: 'test',
      shape: 'single',
      color: 'blue',
      cells: [{ row: 0, col: 0 }],
    }
    expect(canAnyPieceFit(board, [piece])).toBe(true)
  })

  it('returns false when board is full', () => {
    const board = createEmptyBoard()
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        board[r][c] = 'blue'
      }
    }
    const piece: Piece = {
      id: 'test',
      shape: 'single',
      color: 'blue',
      cells: [{ row: 0, col: 0 }],
    }
    expect(canAnyPieceFit(board, [piece])).toBe(false)
  })

  it('returns true when only one piece fits', () => {
    const board = createEmptyBoard()
    // Fill entire board except (0,0)
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        board[r][c] = 'blue'
      }
    }
    board[0][0] = null
    const single: Piece = {
      id: 'single',
      shape: 'single',
      color: 'green',
      cells: [{ row: 0, col: 0 }],
    }
    const line: Piece = {
      id: 'line',
      shape: 'line3h',
      color: 'red' as any,
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }],
    }
    expect(canAnyPieceFit(board, [single, line])).toBe(true)
  })

  it('skips null entries in pieces array', () => {
    const board = createEmptyBoard()
    expect(canAnyPieceFit(board, [null])).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `canAnyPieceFit` not found.

- [ ] **Step 3: Implement game-over detection**

Add to `src/game/engine.ts`:

```typescript
export function canAnyPieceFit(board: Board, pieces: (Piece | null)[]): boolean {
  for (const piece of pieces) {
    if (piece === null) continue
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidPlacement(board, piece, { row, col })) return true
      }
    }
  }
  return false
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/engine.ts src/game/__tests__/engine.test.ts
git commit -m "feat: add game-over detection (canAnyPieceFit)"
```

---

## Chunk 3: Game State Reducer

### Task 8: Implement useGameState reducer

**Files:**
- Create: `src/hooks/useGameState.ts`
- Test: `src/hooks/__tests__/useGameState.test.ts`

- [ ] **Step 1: Write failing tests for the reducer**

Create `src/hooks/__tests__/useGameState.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { gameReducer, createInitialState } from '../useGameState'
import type { GameState } from '../../game/types'
import { BOARD_SIZE } from '../../game/types'

describe('createInitialState', () => {
  it('creates initial state with empty board and 3 pieces', () => {
    const state = createInitialState()
    expect(state.board).toHaveLength(BOARD_SIZE)
    expect(state.pieces.filter(p => p !== null)).toHaveLength(3)
    expect(state.score).toBe(0)
    expect(state.comboMultiplier).toBe(1)
    expect(state.gameOver).toBe(false)
  })
})

describe('gameReducer PLACE_PIECE', () => {
  it('stamps piece on board and adds placement score', () => {
    const state = createInitialState()
    const piece = state.pieces[0]!
    const action = { type: 'PLACE_PIECE' as const, pieceIndex: 0, position: { row: 0, col: 0 } }
    const next = gameReducer(state, action)
    // Piece removed from slot
    expect(next.pieces[0]).toBeNull()
    // Score increased by block count
    expect(next.score).toBeGreaterThanOrEqual(piece.cells.length)
    // Board has blocks
    const filledCells = next.board.flat().filter(c => c !== null)
    expect(filledCells.length).toBeGreaterThanOrEqual(piece.cells.length)
  })

  it('generates new pieces when all 3 are placed', () => {
    let state = createInitialState()
    // Place all 3 pieces in separate rows to avoid clears
    for (let i = 0; i < 3; i++) {
      const piece = state.pieces[i]!
      state = gameReducer(state, {
        type: 'PLACE_PIECE',
        pieceIndex: i,
        position: { row: i * 3, col: 0 },
      })
    }
    // After placing all 3, new set should be generated
    const nonNull = state.pieces.filter(p => p !== null)
    expect(nonNull.length).toBe(3)
  })

  it('resets combo when no lines are cleared', () => {
    let state = createInitialState()
    // Manually set combo to test reset
    state = { ...state, comboMultiplier: 5 }
    const piece = state.pieces[0]!
    const next = gameReducer(state, {
      type: 'PLACE_PIECE',
      pieceIndex: 0,
      position: { row: 0, col: 0 },
    })
    // No lines cleared on mostly empty board, combo resets
    expect(next.comboMultiplier).toBe(1)
  })
})

describe('gameReducer NEW_GAME', () => {
  it('resets state but preserves high score', () => {
    const state: GameState = {
      board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill('blue')),
      pieces: [null, null, null],
      score: 500,
      highScore: 500,
      comboMultiplier: 3,
      gameOver: true,
    }
    const next = gameReducer(state, { type: 'NEW_GAME' })
    expect(next.score).toBe(0)
    expect(next.highScore).toBe(500)
    expect(next.comboMultiplier).toBe(1)
    expect(next.gameOver).toBe(false)
    expect(next.pieces.filter(p => p !== null)).toHaveLength(3)
    expect(next.board.flat().every(c => c === null)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the reducer**

Create `src/hooks/useGameState.ts`:

```typescript
import { useReducer, useCallback } from 'react'
import type { GameState, GameAction, Cell } from '../game/types'
import { createEmptyBoard, isValidPlacement, stampPiece, findClears, applyClear, canAnyPieceFit } from '../game/engine'
import { calculatePlacementScore, calculateClearScore, updateCombo } from '../game/scoring'
import { generatePieceSet } from '../game/pieces'

const HIGH_SCORE_KEY = 'block-blast-high-score'

function loadHighScore(): number {
  const stored = localStorage.getItem(HIGH_SCORE_KEY)
  return stored ? parseInt(stored, 10) || 0 : 0
}

function saveHighScore(score: number): void {
  localStorage.setItem(HIGH_SCORE_KEY, String(score))
}

export function createInitialState(): GameState {
  return {
    board: createEmptyBoard(),
    pieces: generatePieceSet(),
    score: 0,
    highScore: loadHighScore(),
    comboMultiplier: 1,
    gameOver: false,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_PIECE': {
      const { pieceIndex, position } = action
      const piece = state.pieces[pieceIndex]
      if (!piece) return state
      if (!isValidPlacement(state.board, piece, position)) return state

      // 1. Stamp piece
      let board = stampPiece(state.board, piece, position)

      // 2. Placement score
      let score = state.score + calculatePlacementScore(piece.cells.length)

      // 3. Find and apply clears
      const clears = findClears(board)
      if (clears.linesCleared > 0) {
        board = applyClear(board, clears)
      }

      // 4. Clear score
      score += calculateClearScore(clears.linesCleared, state.comboMultiplier)

      // 5. Update combo
      const comboMultiplier = updateCombo(clears.linesCleared, state.comboMultiplier)

      // 6. Remove piece from queue
      const pieces = [...state.pieces] as [typeof state.pieces[0], typeof state.pieces[1], typeof state.pieces[2]]
      pieces[pieceIndex] = null

      // 7. Generate new set if all placed
      const allPlaced = pieces.every(p => p === null)
      const nextPieces = allPlaced ? generatePieceSet() : pieces

      // 8. Update high score
      let highScore = state.highScore
      if (score > highScore) {
        highScore = score
        saveHighScore(highScore)
      }

      // 9. Check game over
      const gameOver = !canAnyPieceFit(board, nextPieces)

      return { board, pieces: nextPieces, score, highScore, comboMultiplier, gameOver }
    }

    case 'NEW_GAME': {
      return {
        ...createInitialState(),
        highScore: state.highScore,
      }
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests pass (jsdom environment was configured in Task 1's `vite.config.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameState.ts src/hooks/__tests__/useGameState.test.ts vite.config.ts
git commit -m "feat: add game state reducer with full game flow"
```

---

## Chunk 4: Visual Components (Board + Cells + Layout)

### Task 9: Global styles and CSS variables

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: Write the base styles**

Replace `src/styles/index.css` (or `src/index.css` if that's what Vite created):

```css
:root {
  --bg-primary: #0F0F2E;
  --bg-board: #1A1A3E;
  --bg-cell-empty: #2A2A5E;
  --cell-gap: 6px;
  --cell-radius: 6px;

  --purple: #9B59B6;
  --purple-light: #B07CC6;
  --purple-dark: #7D3C98;
  --orange: #E67E22;
  --orange-light: #F0A050;
  --orange-dark: #C0651A;
  --yellow: #F1C40F;
  --yellow-light: #F5D442;
  --yellow-dark: #D4AC0D;
  --green: #2ECC71;
  --green-light: #58D68D;
  --green-dark: #27AE60;
  --gray: #95A5A6;
  --gray-light: #B0BEC5;
  --gray-dark: #7F8C8D;
  --blue: #3498DB;
  --blue-light: #5DADE2;
  --blue-dark: #2E86C1;
  --pink: #E91E90;
  --pink-light: #F06AB0;
  --pink-dark: #C0187A;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--bg-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: white;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 16px 8px;
}
```

- [ ] **Step 2: Verify dev server renders with dark background**

```bash
npm run dev
```

Expected: Dark navy background, centered layout.

- [ ] **Step 3: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add global styles with CSS variables for colors and layout"
```

---

### Task 10: Cell component with glossy 3D effect

**Files:**
- Create: `src/components/Cell.tsx`

- [ ] **Step 1: Build the Cell component**

Create `src/components/Cell.tsx`:

```tsx
import type { BlockColor } from '../game/types'

type CellProps = {
  color: BlockColor | null
  preview?: BlockColor | null
  invalid?: boolean
  size?: number
}

const COLOR_MAP: Record<BlockColor, { main: string; light: string; dark: string }> = {
  purple: { main: 'var(--purple)', light: 'var(--purple-light)', dark: 'var(--purple-dark)' },
  orange: { main: 'var(--orange)', light: 'var(--orange-light)', dark: 'var(--orange-dark)' },
  yellow: { main: 'var(--yellow)', light: 'var(--yellow-light)', dark: 'var(--yellow-dark)' },
  green:  { main: 'var(--green)',  light: 'var(--green-light)',  dark: 'var(--green-dark)' },
  gray:   { main: 'var(--gray)',   light: 'var(--gray-light)',   dark: 'var(--gray-dark)' },
  blue:   { main: 'var(--blue)',   light: 'var(--blue-light)',   dark: 'var(--blue-dark)' },
  pink:   { main: 'var(--pink)',   light: 'var(--pink-light)',   dark: 'var(--pink-dark)' },
}

export default function Cell({ color, preview, invalid, size }: CellProps) {
  if (preview && !invalid) {
    const colors = COLOR_MAP[preview]
    return (
      <div
        className="cell cell--preview"
        style={{
          width: size,
          height: size,
          backgroundColor: colors.main,
          opacity: 0.4,
          borderRadius: 'var(--cell-radius)',
        }}
      />
    )
  }

  if (preview && invalid) {
    return (
      <div
        className="cell cell--invalid"
        style={{
          width: size,
          height: size,
          backgroundColor: '#ff000030',
          borderRadius: 'var(--cell-radius)',
        }}
      />
    )
  }

  if (!color) {
    return (
      <div
        className="cell cell--empty"
        style={{
          width: size,
          height: size,
          backgroundColor: 'var(--bg-cell-empty)',
          borderRadius: 'var(--cell-radius)',
        }}
      />
    )
  }

  const colors = COLOR_MAP[color]
  return (
    <div
      className="cell cell--filled"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--cell-radius)',
        background: `linear-gradient(135deg, ${colors.light} 0%, ${colors.main} 40%, ${colors.dark} 100%)`,
        boxShadow: `inset 2px 2px 4px ${colors.light}40, inset -2px -2px 4px ${colors.dark}80, 0 2px 4px rgba(0,0,0,0.3)`,
      }}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Cell.tsx
git commit -m "feat: add Cell component with glossy 3D block rendering"
```

---

### Task 11: Board component

**Files:**
- Create: `src/components/Board.tsx`

- [ ] **Step 1: Build the Board component**

Create `src/components/Board.tsx`:

```tsx
import { useMemo } from 'react'
import Cell from './Cell'
import type { Board as BoardType, BlockColor, Cell as CellType } from '../game/types'
import { BOARD_SIZE } from '../game/types'

type BoardProps = {
  board: BoardType
  previewCells?: CellType[]
  previewColor?: BlockColor | null
  previewValid?: boolean | null
}

export default function Board({ board, previewCells, previewColor, previewValid }: BoardProps) {
  const previewSet = useMemo(() => {
    if (!previewCells) return new Set<string>()
    return new Set(previewCells.map(c => `${c.row},${c.col}`))
  }, [previewCells])

  return (
    <div
      className="board"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gap: 'var(--cell-gap)',
        padding: 'var(--cell-gap)',
        backgroundColor: 'var(--bg-board)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        aspectRatio: '1',
        width: '100%',
        maxWidth: '400px',
      }}
    >
      {board.flatMap((row, r) =>
        row.map((cell, c) => {
          const isPreview = previewSet.has(`${r},${c}`) && previewValid !== null
          return (
            <Cell
              key={`${r}-${c}`}
              color={cell}
              preview={isPreview ? previewColor : null}
              invalid={isPreview && previewValid === false}
            />
          )
        })
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat: add Board component with 10x10 grid rendering"
```

---

### Task 12: ScoreDisplay component

**Files:**
- Create: `src/components/ScoreDisplay.tsx`

- [ ] **Step 1: Build the ScoreDisplay component**

Create `src/components/ScoreDisplay.tsx`:

```tsx
type ScoreDisplayProps = {
  score: number
  highScore: number
  comboMultiplier: number
}

export default function ScoreDisplay({ score, highScore, comboMultiplier }: ScoreDisplayProps) {
  return (
    <div
      className="score-display"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '400px',
        padding: '8px 0',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>HIGH</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{highScore}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>SCORE</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{score}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>COMBO</div>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: comboMultiplier > 1 ? 'var(--yellow)' : 'inherit',
        }}>
          x{comboMultiplier}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScoreDisplay.tsx
git commit -m "feat: add ScoreDisplay component with score, high score, and combo"
```

---

### Task 13: PieceQueue and DraggablePiece components

**Files:**
- Create: `src/components/PieceQueue.tsx`
- Create: `src/components/DraggablePiece.tsx`

- [ ] **Step 1: Build DraggablePiece**

Create `src/components/DraggablePiece.tsx`:

```tsx
import type { Piece } from '../game/types'
import Cell from './Cell'

type DraggablePieceProps = {
  piece: Piece | null
  index: number
  onDragStart: (index: number, piece: Piece) => void
  cellSize?: number
}

export default function DraggablePiece({ piece, index, onDragStart, cellSize = 28 }: DraggablePieceProps) {
  if (!piece) {
    return <div className="piece-slot piece-slot--empty" style={{ width: 80, height: 80 }} />
  }

  const maxRow = Math.max(...piece.cells.map(c => c.row)) + 1
  const maxCol = Math.max(...piece.cells.map(c => c.col)) + 1

  const cellSet = new Set(piece.cells.map(c => `${c.row},${c.col}`))

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    onDragStart(index, piece)
  }

  return (
    <div
      className="piece-slot"
      onPointerDown={handlePointerDown}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${maxCol}, ${cellSize}px)`,
        gap: '2px',
        padding: '8px',
        cursor: 'grab',
        touchAction: 'none',
      }}
    >
      {Array.from({ length: maxRow }, (_, r) =>
        Array.from({ length: maxCol }, (_, c) => {
          const filled = cellSet.has(`${r},${c}`)
          return (
            <Cell
              key={`${r}-${c}`}
              color={filled ? piece.color : null}
              size={cellSize}
            />
          )
        })
      ).flat()}
    </div>
  )
}
```

- [ ] **Step 2: Build PieceQueue**

Create `src/components/PieceQueue.tsx`:

```tsx
import type { Piece } from '../game/types'
import DraggablePiece from './DraggablePiece'

type PieceQueueProps = {
  pieces: [Piece | null, Piece | null, Piece | null]
  onDragStart: (index: number, piece: Piece) => void
}

export default function PieceQueue({ pieces, onDragStart }: PieceQueueProps) {
  return (
    <div
      className="piece-queue"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 0',
        width: '100%',
        maxWidth: '400px',
      }}
    >
      {pieces.map((piece, i) => (
        <DraggablePiece
          key={piece?.id ?? `empty-${i}`}
          piece={piece}
          index={i}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DraggablePiece.tsx src/components/PieceQueue.tsx
git commit -m "feat: add PieceQueue and DraggablePiece components"
```

---

### Task 14: GameOver overlay

**Files:**
- Create: `src/components/GameOver.tsx`

- [ ] **Step 1: Build the GameOver component**

Create `src/components/GameOver.tsx`:

```tsx
type GameOverProps = {
  score: number
  highScore: number
  onNewGame: () => void
}

export default function GameOver({ score, highScore, onNewGame }: GameOverProps) {
  return (
    <div
      className="game-over-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 100,
        animation: 'fadeIn 300ms ease-out',
      }}
    >
      <div style={{
        textAlign: 'center',
        padding: '32px',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-board)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>Game Over</h1>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>Score: {score}</div>
        <div style={{ fontSize: '18px', opacity: 0.7, marginBottom: '24px' }}>
          Best: {highScore}
        </div>
        <button
          onClick={onNewGame}
          style={{
            padding: '12px 32px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'var(--green)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameOver.tsx
git commit -m "feat: add GameOver overlay with Play Again button"
```

---

## Chunk 5: Drag-and-Drop + App Integration

### Task 15: useDragDrop hook

**Files:**
- Create: `src/hooks/useDragDrop.ts`

- [ ] **Step 1: Implement the drag-and-drop hook**

Create `src/hooks/useDragDrop.ts`:

```typescript
import { useState, useCallback, useRef } from 'react'
import type { Cell, DragState, Piece, Board } from '../game/types'
import { BOARD_SIZE } from '../game/types'
import { isValidPlacement } from '../game/engine'

const DRAG_THRESHOLD = 8
const FINGER_OFFSET = 50

type UseDragDropOptions = {
  board: Board
  onDrop: (pieceIndex: number, position: Cell) => void
  boardRef: React.RefObject<HTMLDivElement | null>
}

export function useDragDrop({ board, onDrop, boardRef }: UseDragDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    draggedPieceIndex: null,
    hoverPosition: null,
    placementValidity: null,
  })

  const dragPieceRef = useRef<Piece | null>(null)
  const dragPieceIndexRef = useRef<number | null>(null)  // ref to avoid stale closures
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)

  const getBoardCell = useCallback((clientX: number, clientY: number): Cell | null => {
    const boardEl = boardRef.current
    if (!boardEl) return null
    const rect = boardEl.getBoundingClientRect()
    const padding = parseFloat(getComputedStyle(boardEl).padding) || 4
    const innerWidth = rect.width - padding * 2
    const innerHeight = rect.height - padding * 2
    const col = Math.floor(((clientX - rect.left - padding) / innerWidth) * BOARD_SIZE)
    const row = Math.floor(((clientY - rect.top - padding - FINGER_OFFSET) / innerHeight) * BOARD_SIZE)
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null
    return { row, col }
  }, [boardRef])

  const handleDragStart = useCallback((index: number, piece: Piece) => {
    dragPieceRef.current = piece
    dragPieceIndexRef.current = index
    startPosRef.current = null
    isDraggingRef.current = false
    setDragState({
      draggedPieceIndex: index,
      hoverPosition: null,
      placementValidity: null,
    })
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (dragPieceIndexRef.current === null) return  // use ref to avoid stale closure

    if (!isDraggingRef.current) {
      if (!startPosRef.current) {
        startPosRef.current = { x: e.clientX, y: e.clientY }
        return
      }
      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return
      isDraggingRef.current = true
    }

    setDragPosition({ x: e.clientX, y: e.clientY - FINGER_OFFSET })

    const cell = getBoardCell(e.clientX, e.clientY)
    const piece = dragPieceRef.current
    if (cell && piece) {
      const valid = isValidPlacement(board, piece, cell)
      setDragState(prev => ({
        ...prev,
        hoverPosition: cell,
        placementValidity: valid,
      }))
    } else {
      setDragState(prev => ({
        ...prev,
        hoverPosition: null,
        placementValidity: null,
      }))
    }
  }, [board, getBoardCell])

  const hoverRef = useRef<Cell | null>(null)
  const validRef = useRef<boolean | null>(null)

  // Keep refs in sync with state for use in pointerUp handler
  const handlePointerMoveWrapped = useCallback((e: PointerEvent) => {
    handlePointerMove(e)
  }, [handlePointerMove])

  const handlePointerUp = useCallback(() => {
    const pieceIndex = dragPieceIndexRef.current
    const { hoverPosition, placementValidity } = dragState
    if (pieceIndex !== null && hoverPosition && placementValidity) {
      onDrop(pieceIndex, hoverPosition)
    }
    dragPieceRef.current = null
    dragPieceIndexRef.current = null
    startPosRef.current = null
    isDraggingRef.current = false
    setDragPosition(null)
    setDragState({
      draggedPieceIndex: null,
      hoverPosition: null,
      placementValidity: null,
    })
  }, [dragState, onDrop])

  return {
    dragState,
    dragPosition,
    draggedPiece: dragPieceRef.current,
    handleDragStart,
    handlePointerMove,
    handlePointerUp,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useDragDrop.ts
git commit -m "feat: add useDragDrop hook with touch/pointer support"
```

---

### Task 16: Wire up App.tsx with all components

**Files:**
- Modify: `src/components/App.tsx`

- [ ] **Step 1: Integrate all components in App**

Replace `src/components/App.tsx`:

```tsx
import { useRef, useEffect, useMemo, useCallback } from 'react'
import Board from './Board'
import PieceQueue from './PieceQueue'
import ScoreDisplay from './ScoreDisplay'
import GameOver from './GameOver'
import { useGameState } from '../hooks/useGameState'
import { useDragDrop } from '../hooks/useDragDrop'
import { playPickUp, playPlace, playInvalidDrop } from '../audio/sounds'
import type { Cell, Piece } from '../game/types'

export default function App() {
  const { state, placePiece, newGame } = useGameState()
  const boardRef = useRef<HTMLDivElement>(null)

  // Wrap onDrop to play sound effects
  const handleDrop = useCallback((pieceIndex: number, position: Cell) => {
    playPlace()
    placePiece(pieceIndex, position)
  }, [placePiece])

  const { dragState, dragPosition, draggedPiece, handleDragStart: rawDragStart, handlePointerMove, handlePointerUp: rawPointerUp } =
    useDragDrop({
      board: state.board,
      onDrop: handleDrop,
      boardRef,
    })

  // Wrap dragStart to play pickup sound
  const handleDragStart = useCallback((index: number, piece: Piece) => {
    playPickUp()
    rawDragStart(index, piece)
  }, [rawDragStart])

  // Wrap pointerUp to play invalid sound when dropping on invalid position
  const handlePointerUp = useCallback(() => {
    if (dragState.draggedPieceIndex !== null && dragState.hoverPosition && !dragState.placementValidity) {
      playInvalidDrop()
    }
    rawPointerUp()
  }, [rawPointerUp, dragState])

  useEffect(() => {
    const onMove = (e: PointerEvent) => handlePointerMove(e)
    const onUp = () => handlePointerUp()
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [handlePointerMove, handlePointerUp])

  const previewCells = useMemo(() => {
    if (!dragState.hoverPosition || !draggedPiece) return undefined
    return draggedPiece.cells.map(c => ({
      row: dragState.hoverPosition!.row + c.row,
      col: dragState.hoverPosition!.col + c.col,
    }))
  }, [dragState.hoverPosition, draggedPiece])

  return (
    <div className="game-container">
      <ScoreDisplay
        score={state.score}
        highScore={state.highScore}
        comboMultiplier={state.comboMultiplier}
      />

      <div ref={boardRef} style={{ width: '100%', maxWidth: '400px' }}>
        <Board
          board={state.board}
          previewCells={previewCells}
          previewColor={draggedPiece?.color}
          previewValid={dragState.placementValidity}
        />
      </div>

      <PieceQueue
        pieces={state.pieces}
        onDragStart={handleDragStart}
      />

      {dragPosition && draggedPiece && (
        <div
          style={{
            position: 'fixed',
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%) scale(1.1)',
            pointerEvents: 'none',
            zIndex: 50,
            opacity: 0.8,
          }}
        >
          <PiecePreview piece={draggedPiece} />
        </div>
      )}

      {state.gameOver && (
        <GameOver
          score={state.score}
          highScore={state.highScore}
          onNewGame={newGame}
        />
      )}
    </div>
  )
}

function PiecePreview({ piece }: { piece: Piece }) {
  const maxRow = Math.max(...piece.cells.map(c => c.row)) + 1
  const maxCol = Math.max(...piece.cells.map(c => c.col)) + 1
  const cellSet = new Set(piece.cells.map(c => `${c.row},${c.col}`))
  const size = 32

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${maxCol}, ${size}px)`,
        gap: '3px',
      }}
    >
      {Array.from({ length: maxRow * maxCol }, (_, i) => {
        const r = Math.floor(i / maxCol)
        const c = i % maxCol
        const filled = cellSet.has(`${r},${c}`)
        return (
          <div
            key={`${r}-${c}`}
            style={{
              width: size,
              height: size,
              borderRadius: 'var(--cell-radius)',
              background: filled
                ? `var(--${piece.color})`
                : 'transparent',
              boxShadow: filled
                ? `inset 2px 2px 4px var(--${piece.color}-light), inset -2px -2px 4px var(--${piece.color}-dark)`
                : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Update index.tsx to import styles**

Ensure `src/index.tsx` (or `src/main.tsx` — use whatever Vite created) imports the CSS:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Run dev server and verify the game renders**

```bash
npm run dev
```

Expected: Board renders with 10x10 grid, 3 pieces at bottom, score at top. Drag should move pieces.

- [ ] **Step 4: Commit**

```bash
git add src/components/App.tsx src/index.tsx src/main.tsx
git commit -m "feat: wire up App with Board, PieceQueue, ScoreDisplay, and drag-and-drop"
```

---

## Chunk 6: Audio + Particles + Polish

### Task 17: Web Audio sound synthesis

**Files:**
- Create: `src/audio/sounds.ts`
- Create: `src/hooks/useAudio.ts`

- [ ] **Step 1: Implement sound synthesis**

Create `src/audio/sounds.ts`:

```typescript
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

export function initAudio(): void {
  getCtx()
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

export function playPickUp() {
  playTone(600, 0.1, 'sine', 0.2)
}

export function playPlace() {
  playTone(150, 0.15, 'sine', 0.4)
}

export function playInvalidDrop() {
  playTone(100, 0.1, 'sawtooth', 0.15)
}

export function playLineClear(linesCleared: number) {
  const ctx = getCtx()
  for (let i = 0; i < linesCleared; i++) {
    setTimeout(() => {
      playTone(400 + i * 200, 0.3, 'sine', 0.25)
    }, i * 80)
  }
}

export function playCombo(comboLevel: number) {
  playTone(300 + comboLevel * 100, 0.2, 'sine', 0.2)
}

export function playGameOver() {
  const ctx = getCtx()
  playTone(400, 0.5, 'sine', 0.3)
  setTimeout(() => playTone(300, 0.5, 'sine', 0.3), 200)
  setTimeout(() => playTone(200, 0.8, 'sine', 0.3), 400)
}
```

- [ ] **Step 2: Implement useAudio hook**

Create `src/hooks/useAudio.ts`:

```typescript
import { useEffect, useRef } from 'react'
import type { GameState } from '../game/types'
import { initAudio, playLineClear, playCombo, playGameOver } from '../audio/sounds'

export function useAudio(state: GameState) {
  const prevScoreRef = useRef(state.score)
  const prevComboRef = useRef(state.comboMultiplier)
  const prevGameOverRef = useRef(state.gameOver)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      prevScoreRef.current = state.score
      prevComboRef.current = state.comboMultiplier
      prevGameOverRef.current = state.gameOver
      return
    }

    // Game over sound
    if (state.gameOver && !prevGameOverRef.current) {
      playGameOver()
    }

    // Combo increased = lines were cleared
    if (state.comboMultiplier > prevComboRef.current) {
      const linesGuess = state.comboMultiplier - prevComboRef.current
      playLineClear(linesGuess)
      if (state.comboMultiplier > 2) {
        playCombo(state.comboMultiplier)
      }
    }

    prevScoreRef.current = state.score
    prevComboRef.current = state.comboMultiplier
    prevGameOverRef.current = state.gameOver
  }, [state.score, state.comboMultiplier, state.gameOver])

  // Initialize audio on first user interaction
  useEffect(() => {
    const handler = () => {
      initAudio()
      window.removeEventListener('pointerdown', handler)
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])
}
```

- [ ] **Step 3: Add useAudio to App.tsx**

Add to `App.tsx` after `useGameState`:

```tsx
import { useAudio } from '../hooks/useAudio'
// Inside App():
useAudio(state)
```

- [ ] **Step 4: Commit**

```bash
git add src/audio/sounds.ts src/hooks/useAudio.ts src/components/App.tsx
git commit -m "feat: add Web Audio synthesized sound effects"
```

---

### Task 18: Particle canvas overlay

**Files:**
- Create: `src/components/ParticleCanvas.tsx`

- [ ] **Step 1: Build the particle system**

Create `src/components/ParticleCanvas.tsx`:

```tsx
import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'

type Particle = {
  x: number; y: number
  vx: number; vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

export type ParticleCanvasHandle = {
  emit: (x: number, y: number, color: string, count: number) => void
}

const ParticleCanvas = forwardRef<ParticleCanvasHandle, { width: number; height: number }>(
  ({ width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const animFrameRef = useRef<number>(0)

    const emit = useCallback((x: number, y: number, color: string, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 2 + Math.random() * 4
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 5,
          color,
          life: 1,
          maxLife: 0.3 + Math.random() * 0.3,
        })
      }
    }, [])

    useImperativeHandle(ref, () => ({ emit }), [emit])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let lastTime = performance.now()

      const animate = (time: number) => {
        const dt = (time - lastTime) / 1000
        lastTime = time

        ctx.clearRect(0, 0, width, height)

        const particles = particlesRef.current
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          p.x += p.vx
          p.y += p.vy
          p.vy += 8 * dt // gravity
          p.life -= dt / p.maxLife

          if (p.life <= 0) {
            particles.splice(i, 1)
            continue
          }

          ctx.globalAlpha = p.life
          ctx.fillStyle = p.color
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
        }

        ctx.globalAlpha = 1
        animFrameRef.current = requestAnimationFrame(animate)
      }

      animFrameRef.current = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animFrameRef.current)
    }, [width, height])

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    )
  }
)

export default ParticleCanvas
```

- [ ] **Step 2: Add `lastClear` to GameState and update reducer**

In `src/game/types.ts`, add `lastClear` to `GameState`:

```typescript
export type GameState = {
  board: Board
  pieces: [Piece | null, Piece | null, Piece | null]
  score: number
  highScore: number
  comboMultiplier: number
  gameOver: boolean
  lastClear: ClearResult | null  // set after a clear, null otherwise
}
```

In `src/hooks/useGameState.ts`, update `createInitialState` to include `lastClear: null`, and update the `PLACE_PIECE` case return:

```typescript
return { board, pieces: nextPieces, score, highScore, comboMultiplier, gameOver, lastClear: clears.linesCleared > 0 ? clears : null }
```

And in `NEW_GAME`:
```typescript
return { ...createInitialState(), highScore: state.highScore }
```

- [ ] **Step 3: Wire particles and screen shake in App.tsx**

Add to `App.tsx` — after existing imports and hooks:

```tsx
import ParticleCanvas, { ParticleCanvasHandle } from './ParticleCanvas'

// Inside App():
const particleRef = useRef<ParticleCanvasHandle>(null)
const [boardSize, setBoardSize] = useState({ width: 0, height: 0 })
const [shaking, setShaking] = useState(false)

// Track board dimensions for particle canvas
useEffect(() => {
  const el = boardRef.current
  if (!el) return
  const observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect
    setBoardSize({ width, height })
  })
  observer.observe(el)
  return () => observer.disconnect()
}, [])

// Emit particles and trigger shake on line clears
useEffect(() => {
  const clear = state.lastClear
  if (!clear || clear.linesCleared === 0) return
  const el = boardRef.current
  if (!el || !particleRef.current) return

  const rect = el.getBoundingClientRect()
  const padding = parseFloat(getComputedStyle(el).padding) || 6
  const cellW = (rect.width - padding * 2) / 10
  const cellH = (rect.height - padding * 2) / 10

  // Color lookup from the board (before clear was applied — use a CSS var fallback)
  for (const cell of clear.clearedCells) {
    const x = padding + cell.col * cellW + cellW / 2
    const y = padding + cell.row * cellH + cellH / 2
    particleRef.current.emit(x, y, '#ffffff', clear.linesCleared >= 2 ? 6 : 3)
  }

  // Screen shake for multi-line clears
  if (clear.linesCleared >= 2) {
    setShaking(true)
    setTimeout(() => setShaking(false), 200)
  }
}, [state.lastClear])
```

In the JSX, wrap the board with the particle canvas:

```tsx
<div
  ref={boardRef}
  className={shaking ? 'board--shaking' : ''}
  style={{ width: '100%', maxWidth: '400px', position: 'relative' }}
>
  <Board
    board={state.board}
    previewCells={previewCells}
    previewColor={draggedPiece?.color}
    previewValid={dragState.placementValidity}
    clearingCells={state.lastClear?.clearedCells}
  />
  <ParticleCanvas ref={particleRef} width={boardSize.width} height={boardSize.height} />
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ParticleCanvas.tsx src/hooks/useGameState.ts src/game/types.ts src/components/App.tsx
git commit -m "feat: add particle canvas overlay for line clear effects"
```

---

### Task 19: Animations — line clear flash, screen shake, score pop

**Files:**
- Modify: `src/styles/index.css`
- Modify: `src/components/Board.tsx`
- Modify: `src/components/ScoreDisplay.tsx`

- [ ] **Step 1: Add CSS animations**

Append to `src/styles/index.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scorePop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

@keyframes comboPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); color: var(--yellow); }
  100% { transform: scale(1); }
}

@keyframes cellClear {
  0% { transform: scale(1); filter: brightness(1); }
  30% { transform: scale(1.2); filter: brightness(2); }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes shake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-3px, -2px); }
  20% { transform: translate(3px, 2px); }
  30% { transform: translate(-2px, 3px); }
  40% { transform: translate(2px, -3px); }
  50% { transform: translate(-3px, 2px); }
  60% { transform: translate(3px, -2px); }
  70% { transform: translate(-2px, -3px); }
  80% { transform: translate(2px, 3px); }
  90% { transform: translate(-3px, -2px); }
}

.board--shaking {
  animation: shake 200ms ease-out;
}

.cell--clearing {
  animation: cellClear 300ms ease-out forwards;
}

.score--popping {
  animation: scorePop 300ms ease-out;
}

.combo--pulsing {
  animation: comboPulse 300ms ease-out;
}
```

- [ ] **Step 2: Update Board.tsx to accept `clearingCells` and apply animation class**

Add `clearingCells` prop to `BoardProps`:

```typescript
type BoardProps = {
  board: BoardType
  previewCells?: CellType[]
  previewColor?: BlockColor | null
  previewValid?: boolean | null
  clearingCells?: CellType[]
}
```

Build a clearing set and apply the class:

```tsx
const clearingSet = useMemo(() => {
  if (!clearingCells) return new Set<string>()
  return new Set(clearingCells.map(c => `${c.row},${c.col}`))
}, [clearingCells])

// In the cell render:
const isClearing = clearingSet.has(`${r},${c}`)
return (
  <div key={`${r}-${c}`} className={isClearing ? 'cell--clearing' : ''}>
    <Cell ... />
  </div>
)
```

- [ ] **Step 3: Update ScoreDisplay.tsx to animate score changes**

```tsx
import { useRef, useEffect, useState } from 'react'

// Inside ScoreDisplay:
const [popping, setPopping] = useState(false)
const prevScoreRef = useRef(score)

useEffect(() => {
  if (score !== prevScoreRef.current) {
    setPopping(true)
    const timer = setTimeout(() => setPopping(false), 300)
    prevScoreRef.current = score
    return () => clearTimeout(timer)
  }
}, [score])

// On the score div:
<div className={popping ? 'score--popping' : ''} style={{ fontSize: '32px', fontWeight: 'bold' }}>
  {score}
</div>
```

Similarly for combo:
```tsx
const [comboPulsing, setComboPulsing] = useState(false)
const prevComboRef = useRef(comboMultiplier)

useEffect(() => {
  if (comboMultiplier > prevComboRef.current) {
    setComboPulsing(true)
    const timer = setTimeout(() => setComboPulsing(false), 300)
    prevComboRef.current = comboMultiplier
    return () => clearTimeout(timer)
  }
  prevComboRef.current = comboMultiplier
}, [comboMultiplier])

<div className={comboPulsing ? 'combo--pulsing' : ''} style={{ ... }}>
  x{comboMultiplier}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/styles/index.css src/components/Board.tsx src/components/ScoreDisplay.tsx
git commit -m "feat: add animations for line clears, screen shake, score pop, and combo pulse"
```

---

### Task 20: Final integration testing and polish

**Files:**
- All files

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Manual playtesting checklist**

```bash
npm run dev
```

Verify:
- [ ] Board renders 10x10 with correct colors
- [ ] 3 pieces appear at bottom
- [ ] Dragging a piece shows ghost preview on board
- [ ] Valid placement highlights green, invalid red
- [ ] Dropping a piece places it and updates score
- [ ] Completing a row clears it with animation
- [ ] Completing a column clears it with animation
- [ ] Simultaneous row+column clear works
- [ ] Combo multiplier increases and displays correctly
- [ ] All 3 pieces placed triggers new set
- [ ] Game over triggers when no pieces fit
- [ ] Play Again resets the game
- [ ] High score persists across page refresh
- [ ] Sound effects play on interactions
- [ ] Particles emit on line clear
- [ ] Screen shakes on multi-line clear
- [ ] Works on mobile viewport (responsive)

- [ ] **Step 3: Fix any issues found during playtesting**

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Block Blast game with full juice"
```
