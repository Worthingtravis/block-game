import type { GameState, Board, Piece, BlockColor } from './types'
import { BOARD_SIZE, BLOCK_COLORS } from './types'
import { SHAPE_DEFINITIONS } from './pieces'
import type { ShapeType } from './types'

// Format: <board:32bytes><piece0><piece1><piece2><score:2bytes><combo:1byte>
// Board: 64 nibbles (4 bits each) packed into 32 bytes. 0=empty, 1-11=color index.
// Piece: 1 byte shape index (0-22), 255=empty slot.
// Score: 2 bytes big-endian (max 65535).
// Combo: 1 byte.
// Total: 38 bytes → ~51 chars base64url (was ~120+ chars)

const COLOR_TO_IDX: Record<string, number> = {}
BLOCK_COLORS.forEach((c, i) => { COLOR_TO_IDX[c] = i + 1 })

const ALL_SHAPES = Object.keys(SHAPE_DEFINITIONS) as ShapeType[]
const SHAPE_TO_IDX: Record<string, number> = {}
ALL_SHAPES.forEach((s, i) => { SHAPE_TO_IDX[s] = i })

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - s.length % 4) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function serializeState(state: GameState): string {
  const buf = new Uint8Array(38)

  // Board: pack 2 cells per byte
  const flat = state.board.flat()
  for (let i = 0; i < 64; i += 2) {
    const hi = flat[i] ? COLOR_TO_IDX[flat[i]!] : 0
    const lo = flat[i + 1] ? COLOR_TO_IDX[flat[i + 1]!] : 0
    buf[i >> 1] = (hi << 4) | lo
  }

  // Pieces: 1 byte each
  for (let i = 0; i < 3; i++) {
    const p = state.pieces[i]
    buf[32 + i] = p ? SHAPE_TO_IDX[p.shape] : 255
  }

  // Score: 2 bytes big-endian, clamped to 65535
  const score = Math.min(state.score, 65535)
  buf[35] = (score >> 8) & 0xff
  buf[36] = score & 0xff

  // Combo: 1 byte
  buf[37] = Math.min(state.comboMultiplier, 255)

  return toBase64Url(buf)
}

export function deserializeState(hash: string): Partial<GameState> | null {
  try {
    const buf = fromBase64Url(hash)
    if (buf.length < 38) return legacyDeserialize(hash)

    // Board
    const board: Board = []
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row: (BlockColor | null)[] = []
      for (let c = 0; c < BOARD_SIZE; c++) {
        const i = r * BOARD_SIZE + c
        const byte = buf[i >> 1]
        const nibble = (i % 2 === 0) ? (byte >> 4) : (byte & 0x0f)
        row.push(nibble === 0 ? null : (BLOCK_COLORS[nibble - 1] ?? null))
      }
      board.push(row)
    }

    // Pieces
    const pieces: [Piece | null, Piece | null, Piece | null] = [null, null, null]
    for (let i = 0; i < 3; i++) {
      const idx = buf[32 + i]
      if (idx < ALL_SHAPES.length) {
        const shape = ALL_SHAPES[idx]
        pieces[i] = {
          id: crypto.randomUUID(),
          shape,
          color: BLOCK_COLORS[COLOR_TO_IDX[shapeColor(shape)] - 1] ?? 'gray',
          cells: SHAPE_DEFINITIONS[shape],
        }
      }
    }

    const score = (buf[35] << 8) | buf[36]
    const comboMultiplier = buf[37] || 1

    return { board, pieces, score, comboMultiplier, gameOver: false, lastClear: null }
  } catch {
    return legacyDeserialize(hash)
  }
}

// Support old JSON-based URLs so existing links don't break
function legacyDeserialize(hash: string): Partial<GameState> | null {
  try {
    const data = JSON.parse(atob(hash))
    const board: Board = []
    const s = data.b as string
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row: (BlockColor | null)[] = []
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = parseInt(s[r * BOARD_SIZE + c])
        row.push(idx === 0 ? null : BLOCK_COLORS[idx - 1])
      }
      board.push(row)
    }
    const pieces = (data.p as string[]).map((ps: string) => {
      if (ps === '_') return null
      const [shape, color] = ps.split(':') as [keyof typeof SHAPE_DEFINITIONS, BlockColor]
      if (!SHAPE_DEFINITIONS[shape]) return null
      return { id: crypto.randomUUID(), shape, color, cells: SHAPE_DEFINITIONS[shape] }
    }) as [Piece | null, Piece | null, Piece | null]
    return { board, pieces, score: data.s ?? 0, comboMultiplier: data.c ?? 1, gameOver: false, lastClear: null }
  } catch {
    return null
  }
}

function shapeColor(shape: ShapeType): string {
  // Import would be circular, so inline the map lookup via pieces module
  const map: Record<string, string> = {
    single: 'gray',
    line2h: 'teal', line2v: 'teal',
    line3h: 'blue', line3v: 'blue',
    line4h: 'indigo', line4v: 'indigo',
    line5h: 'pink', line5v: 'pink',
    square2: 'orange', square3: 'yellow',
    L1: 'green', L2: 'green', L3: 'green', L4: 'green',
    T1: 'purple', T2: 'purple', T3: 'purple', T4: 'purple',
    Z1: 'red', Z2: 'red', S1: 'lime', S2: 'lime',
  }
  return map[shape] ?? 'gray'
}

export function getStateFromUrl(): Partial<GameState> | null {
  const hash = window.location.hash.slice(1)
  if (!hash) return null
  return deserializeState(hash)
}

export function setStateToUrl(state: GameState): void {
  const serialized = serializeState(state)
  window.history.replaceState(null, '', `#${serialized}`)
}
