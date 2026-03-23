import { describe, it, expect } from 'vitest'
import { BOARD_SIZE, BLOCK_COLORS } from '../types'

describe('constants', () => {
  it('BOARD_SIZE is 8', () => {
    expect(BOARD_SIZE).toBe(8)
  })

  it('has 11 block colors', () => {
    expect(BLOCK_COLORS).toHaveLength(11)
  })
})
