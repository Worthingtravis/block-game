const COLOR_PALETTE = [
  '#4a90d9', // 2
  '#2bbcb3', // 4
  '#4caf50', // 8
  '#8bc34a', // 16
  '#ffdd44', // 32
  '#ff9800', // 64
  '#f44336', // 128
  '#e91e90', // 256
  '#9c27b0', // 512
  '#5c6bc0', // 1K
  '#d4af37', // 2K
  '#ff4081', // 4K
  '#00e5ff', // 8K
  '#76ff03', // 16K
]

export function formatValue(value: number): string {
  if (value >= 1_000_000_000) return `${Math.floor(value / 1_000_000_000)}B`
  if (value >= 1_000_000) return `${Math.floor(value / 1_000_000)}M`
  if (value >= 1_000) return `${Math.floor(value / 1_000)}K`
  return String(value)
}

export function getValueColor(value: number): string {
  const index = Math.round(Math.log2(value)) - 1
  return COLOR_PALETTE[index % COLOR_PALETTE.length]
}
