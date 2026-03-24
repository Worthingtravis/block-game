import { memo } from 'react'
import type { MergeValue } from '../game/types'
import { VALUE_COLORS } from '../game/types'

type MergeCellProps = {
  value: MergeValue | null
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

  return (
    <div
      className={classes}
      style={{ backgroundColor: VALUE_COLORS[value] }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      data-value={value}
    >
      {value}
    </div>
  )
})
