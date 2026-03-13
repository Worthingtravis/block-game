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
