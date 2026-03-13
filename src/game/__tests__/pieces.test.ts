import { describe, it, expect } from 'vitest'
import { SHAPE_DEFINITIONS, generatePiece, generatePieceSet } from '../pieces'
import type { ShapeType } from '../types'
import { BLOCK_COLORS } from '../types'

describe('SHAPE_DEFINITIONS', () => {
  it('contains all 21 shape types', () => {
    expect(Object.keys(SHAPE_DEFINITIONS)).toHaveLength(23)
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
