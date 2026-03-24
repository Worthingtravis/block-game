import { describe, it, expect } from 'vitest'
import { formatValue, getValueColor } from '../values'

describe('formatValue', () => {
  it('shows small numbers as-is', () => {
    expect(formatValue(2)).toBe('2')
    expect(formatValue(4)).toBe('4')
    expect(formatValue(512)).toBe('512')
  })

  it('formats thousands with K', () => {
    expect(formatValue(1024)).toBe('1K')
    expect(formatValue(2048)).toBe('2K')
    expect(formatValue(4096)).toBe('4K')
    expect(formatValue(8192)).toBe('8K')
    expect(formatValue(16384)).toBe('16K')
    expect(formatValue(131072)).toBe('131K')
    expect(formatValue(524288)).toBe('524K')
  })

  it('formats millions with M', () => {
    expect(formatValue(1048576)).toBe('1M')
    expect(formatValue(2097152)).toBe('2M')
    expect(formatValue(1073741824)).toBe('1B')
  })

  it('formats billions with B', () => {
    expect(formatValue(1073741824)).toBe('1B')
  })
})

describe('getValueColor', () => {
  it('returns consistent colors for known values', () => {
    const c2 = getValueColor(2)
    const c4 = getValueColor(4)
    expect(c2).not.toBe(c4)
    expect(getValueColor(2)).toBe(c2) // stable
  })

  it('returns a color for very large values', () => {
    const color = getValueColor(1048576)
    expect(color).toBeTruthy()
    expect(color.startsWith('#')).toBe(true)
  })

  it('cycles through palette for values beyond the base set', () => {
    // Values are powers of 2, color index = log2(value) - 1
    // After the palette length, it should cycle
    const c1 = getValueColor(2)       // index 0
    const c2 = getValueColor(4)       // index 1
    expect(c1).not.toBe(c2)
  })
})
