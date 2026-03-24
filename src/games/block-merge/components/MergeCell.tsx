import { memo } from 'react'
import { getValueColor, formatValue } from '../game/values'

type MergeCellProps = {
  value: number | null
  merging?: boolean
  dropping?: boolean
  columnHighlight?: boolean
  onClick?: () => void
  onMouseEnter?: () => void
}

export default memo(function MergeCell({ value, merging, dropping, columnHighlight, onClick, onMouseEnter }: MergeCellProps) {
  if (!value) {
    const emptyClasses = columnHighlight
      ? 'merge-cell merge-cell--empty merge-cell--col-hover'
      : 'merge-cell merge-cell--empty'

    return (
      <div
        className={emptyClasses}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
      />
    )
  }

  const classes = [
    'merge-cell',
    merging && 'merge-cell--merging',
    dropping && 'merge-cell--dropping',
  ].filter(Boolean).join(' ')

  const formatted = formatValue(value)
  const small = formatted.length >= 3

  return (
    <div
      className={classes}
      style={{ backgroundColor: getValueColor(value), fontSize: small ? '0.85rem' : undefined }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {formatted}
    </div>
  )
})
