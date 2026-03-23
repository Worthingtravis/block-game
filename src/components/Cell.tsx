import { memo } from 'react'
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
  red:    { main: 'var(--red)',    light: 'var(--red-light)',    dark: 'var(--red-dark)' },
  teal:   { main: 'var(--teal)',   light: 'var(--teal-light)',   dark: 'var(--teal-dark)' },
  lime:   { main: 'var(--lime)',   light: 'var(--lime-light)',   dark: 'var(--lime-dark)' },
  indigo: { main: 'var(--indigo)', light: 'var(--indigo-light)', dark: 'var(--indigo-dark)' },
}

export default memo(function Cell({ color, preview, invalid, size }: CellProps) {
  const base: React.CSSProperties = {
    width: size ?? '100%',
    height: size ?? undefined,
    aspectRatio: size ? undefined : '1',
    borderRadius: 'var(--cell-radius)',
  }

  if (preview && !invalid) {
    const colors = COLOR_MAP[preview]
    return <div className="cell cell--preview" style={{ ...base, backgroundColor: colors.main, opacity: 0.4 }} />
  }

  if (preview && invalid) {
    return <div className="cell cell--invalid" style={{ ...base, backgroundColor: '#ff000030' }} />
  }

  if (!color) {
    return <div className="cell cell--empty" style={{ ...base, backgroundColor: 'var(--bg-cell-empty)' }} />
  }

  const colors = COLOR_MAP[color]
  return (
    <div
      className="cell cell--filled"
      style={{
        ...base,
        background: `linear-gradient(135deg, ${colors.light} 0%, ${colors.main} 40%, ${colors.dark} 100%)`,
        boxShadow: `inset 2px 2px 4px ${colors.light}40, inset -2px -2px 4px ${colors.dark}80, 0 2px 4px rgba(0,0,0,0.3)`,
      }}
    />
  )
})
