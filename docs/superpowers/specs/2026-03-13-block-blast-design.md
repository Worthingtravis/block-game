# Block Blast — Game Design Spec

## Overview

Block Blast is a mobile-first block puzzle game built with React + TypeScript. Players drag Tetris-like shapes onto a 10x10 grid, filling complete rows or columns to clear them and score points. The game features glossy 3D block visuals, satisfying animations, synthesized audio, and combo-based scoring.

## Core Rules

- 10x10 grid
- Drag-and-drop placement, no rotation
- 3 pieces dealt at a time; all 3 must be placed before the next set appears
- Filling a complete row or column clears it instantly
- Rows and columns are cleared simultaneously (single pass)
- Game ends when no remaining piece can fit anywhere on the board
- No time limit

## Tech Stack

- React + TypeScript
- CSS for grid rendering and glossy 3D block aesthetic
- Canvas overlay for particle effects only
- Web Audio API for synthesized sound effects
- No external game framework or animation library

## Architecture

```
block-game/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── App.tsx
│   │   ├── Board.tsx          # 10x10 grid rendering
│   │   ├── Cell.tsx           # Individual glossy block cell
│   │   ├── PieceQueue.tsx     # Shows 3 available pieces
│   │   ├── DraggablePiece.tsx # Touch/pointer drag handling
│   │   ├── ScoreDisplay.tsx   # Score + combo multiplier
│   │   ├── GameOver.tsx       # Game over overlay
│   │   └── ParticleCanvas.tsx # Canvas overlay for particle effects
│   ├── game/
│   │   ├── engine.ts          # Core game logic (pure functions)
│   │   ├── pieces.ts          # Shape definitions
│   │   ├── scoring.ts         # Score calculation + combo logic
│   │   └── types.ts           # TypeScript types
│   ├── hooks/
│   │   ├── useGameState.ts    # useReducer-based game state
│   │   ├── useDragDrop.ts     # Touch/pointer drag logic
│   │   └── useAudio.ts        # Web Audio API sound effects
│   ├── audio/
│   │   └── sounds.ts          # Sound synthesis (no audio files needed)
│   ├── styles/
│   │   └── index.css          # Global styles + CSS variables for block colors
│   └── index.tsx
├── package.json
└── tsconfig.json
```

**Key decisions:**
- Game logic in `game/` as pure functions — testable, no React dependency
- Drag-and-drop is a custom hook — full control over mobile touch feel
- Sounds synthesized with Web Audio API — no asset files to load
- Single canvas overlay for particles, everything else is CSS

## Constants

```typescript
const BOARD_SIZE = 10
```

## Types

```typescript
type BlockColor = 'purple' | 'orange' | 'yellow' | 'green' | 'gray' | 'blue' | 'pink'

type ShapeType = 'single' | 'line2h' | 'line2v' | 'line3h' | 'line3v' | 'line4h' | 'line4v'
  | 'line5h' | 'line5v' | 'square2' | 'square3'
  | 'L1' | 'L2' | 'L3' | 'L4'    // 4 L-shape mirror variants
  | 'T1' | 'T2' | 'T3' | 'T4'    // 4 T-shape orientations
  | 'Z1' | 'Z2' | 'S1' | 'S2'    // Z and S orientations

type Piece = {
  id: string             // generated via crypto.randomUUID()
  shape: ShapeType
  color: BlockColor      // randomized per piece generation
  cells: readonly { row: number; col: number }[]  // relative to top-left anchor
}

type GameState = {
  board: (BlockColor | null)[][]  // BOARD_SIZE x BOARD_SIZE
  pieces: [Piece | null, Piece | null, Piece | null]
  score: number
  highScore: number      // written to localStorage whenever score > highScore
  comboMultiplier: number // initial value: 1
  gameOver: boolean       // initial value: false
}

// Initial state: empty board (all null), 3 random pieces, score 0, highScore from localStorage, comboMultiplier 1, gameOver false

type DragState = {
  draggedPieceIndex: number | null
  hoverPosition: { row: number; col: number } | null
  placementValidity: boolean | null
}

type ClearResult = {
  clearedRows: number[]
  clearedCols: number[]
  clearedCells: { row: number; col: number }[]
  linesCleared: number   // = clearedRows.length + clearedCols.length
}
```

### Hook Interaction Contract

- `useGameState` owns `GameState` via `useReducer`. It exposes a `dispatch` function with actions: `PLACE_PIECE`, `NEW_GAME`.
- `useDragDrop` owns `DragState` via `useState`. It reads `GameState` (board + pieces) to compute placement validity.
- On pointer-up with a valid placement, `useDragDrop` calls `dispatch({ type: 'PLACE_PIECE', pieceIndex, position })` and resets its own drag state.
- `useGameState` reducer handles all game logic: stamping, clearing, scoring, combo, game-over check.
- `useAudio` subscribes to state changes and plays sounds reactively (e.g., when `comboMultiplier` increases, when `gameOver` becomes true).

## Game Flow (Per Placement)

1. Validate placement (bounds + all cells empty)
2. Stamp piece onto board
3. Add placement score (`+1 per block`)
4. Find all full rows AND all full columns in one pass
5. Build union set of cells to clear — clear simultaneously
6. Compute `linesCleared = clearedRows.length + clearedCols.length` (rows + columns both count)
7. Add clear score: `10 * linesCleared * linesCleared * comboMultiplier`
8. Update combo: if `linesCleared >= 1`, increment `comboMultiplier` by 1; otherwise reset to `1`
9. Remove piece from queue slot (set to `null`)
10. If all 3 slots are `null`, generate next 3 pieces
11. Check if any remaining piece fits anywhere on the board
12. If none fit, `gameOver = true` — show Game Over overlay with final score, high score, and "Play Again" button

## Scoring

**Single unified formula per placement:**
- Placement score: `+1 per block` in the piece
- Clear score: `10 * linesCleared * linesCleared * comboMultiplier`
- Where `linesCleared = clearedRows.length + clearedCols.length` (both count)
- Total score gain = placement score + clear score

**Combo rules:**
- `comboMultiplier` starts at `1`
- If placement clears >= 1 line: use current multiplier for scoring, then increment by 1
- If placement clears 0 lines: reset to `1`

**Example:** Place a 5-block piece, clear 1 row + 1 column (linesCleared = 2), combo is currently 3:
- Score gain = `5 + (10 * 2 * 2 * 3) = 5 + 120 = 125`
- Then comboMultiplier becomes 4

## Piece Definitions

Full classic set:
- Single cell (1x1)
- Lines: 1x2, 1x3, 1x4, 1x5 (horizontal + vertical variants)
- Squares: 2x2, 3x3
- L-shapes: 2x3, 3x2 (all 4 mirror variants)
- T-shapes (all 4 orientations)
- Z/S-shapes (both orientations)

Pieces are not rotatable. Each orientation is a distinct piece in the pool.

Pieces are not rotatable. Each orientation is a distinct piece in the pool. Total: ~21 distinct shapes.

**Color assignment:** randomized per piece generation (not fixed per shape type).

**Generation rules (v1):** All shapes equally likely. Duplicates within a single deal of 3 are allowed. Weighted distribution is a future tuning option.

**Piece ID generation:** `crypto.randomUUID()` per piece instance.

## Visual Design

### Block Rendering (CSS)
- Rounded squares with 3D effect via CSS
- Glossy highlight on top-left edge (lighter shade)
- Shadow on bottom-right edge (darker shade)
- Subtle inner gradient for depth
- ~6px gap between cells (dark navy background showing through)

### Color Palette

| Color | Main | Light Edge | Dark Edge |
|-------|------|-----------|-----------|
| Purple | `#9B59B6` | `#B07CC6` | `#7D3C98` |
| Orange | `#E67E22` | `#F0A050` | `#C0651A` |
| Yellow | `#F1C40F` | `#F5D442` | `#D4AC0D` |
| Green | `#2ECC71` | `#58D68D` | `#27AE60` |
| Gray | `#95A5A6` | `#B0BEC5` | `#7F8C8D` |
| Blue | `#3498DB` | `#5DADE2` | `#2E86C1` |
| Pink | `#E91E90` | `#F06AB0` | `#C0187A` |

### Layout (Mobile-First)
- Score/combo bar pinned to top
- Board centered in middle
- 3-piece queue at bottom with comfortable touch targets
- Pieces in queue at ~70% scale, expand to full size when picked up

### Board
- Deep navy background (`#1A1A3E`)
- Slightly lighter empty cell slots (`#2A2A5E`)
- Subtle rounded corners and soft shadow

## Animations

| Action | Animation |
|--------|-----------|
| Drag | Piece follows finger, 1.1x scale-up, shadow underneath |
| Valid hover | Target cells glow with piece color at 40% opacity |
| Invalid hover | Subtle red tint on cells |
| Snap to grid | Ease-out 150ms into final position |
| Line clear | Cells flash white, scale up, burst outward and fade (300ms) |
| Combo | Score pops with scale animation, combo text pulses |
| Game over | Board dims, overlay slides up |

### Particles (Canvas Overlay)
- Line clear: colored squares scatter outward from cleared cells
- Multi-line clear: more particles + brief screen shake
- Particles fade over ~500ms
- Canvas must match board container dimensions and re-sync on viewport resize

### Screen Shake
- On 2+ line clears: translate board container randomly 2-4px for ~200ms
- Intensity scales with lines cleared
- CSS transform only, no layout thrashing

## Touch & Drag-and-Drop

- Touch/pointer down on queue piece starts drag
- Piece lifts to full size, offset ~50px above touch point so piece is visible above finger
- Snaps to nearest valid grid position during drag
- Ghost preview on board in real-time
- Release drops if valid, otherwise piece animates back to queue
- Minimum touch target: 44x44px
- Drag threshold: 8px before drag activates
- `touch-action: none` on game container to prevent scroll
- Desktop support via pointer events (single codebase)
- Multi-touch ignored during active drag
- Drag off-screen returns piece to queue

## Audio (Web Audio API)

All sounds synthesized at runtime. Single `AudioContext` created on first user interaction.

| Action | Sound |
|--------|-------|
| Pick up piece | Short sine blip up (pop) |
| Place piece | Low frequency burst, fast decay (thud) |
| Invalid drop | Short low sawtooth (dull buzz) |
| Line clear | Ascending sine sweep with reverb (chime) |
| Multi-line clear | Staggered ascending tones (layered chime) |
| Combo streak | Pitch increases with combo level |
| Game over | Slow falling pitch with fade |

## Data Persistence

### New Game
- Game Over overlay shows "Play Again" button
- `NEW_GAME` action resets board, score, comboMultiplier, generates fresh 3 pieces
- High score is preserved (not reset)

### Phase 1 (This Build)
- High score saved to `localStorage` whenever `score > highScore`
- Persists across sessions
- Displayed alongside current score

### Phase 2 (Future)
- Online leaderboard via backend API
- Submit score + player name on game over
- Fetch and display top scores
- Not in scope for initial build
