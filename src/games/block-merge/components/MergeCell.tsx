import { memo } from 'react'
import type { MergeValue } from '../game/types'
import { VALUE_COLORS } from '../game/types'

type MergeCellProps = {
  value: MergeValue | null
  merging?: boolean
  dropping?: boolean
  onClick?: () => void
}

export default memo(function MergeCell({ value, merging, dropping, onClick }: MergeCellProps) {
  if (!value) {
    return <div className="merge-cell merge-cell--empty" onClick={onClick} />
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
      data-value={value}
    >
      {value}
    </div>
  )
})
