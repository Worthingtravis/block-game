import { memo } from 'react'
import type { MergeValue } from '../game/types'
import { VALUE_COLORS } from '../game/types'

type MergeCellProps = {
  value: MergeValue | null
  highlight?: boolean
  onClick?: () => void
}

export default memo(function MergeCell({ value, highlight, onClick }: MergeCellProps) {
  if (!value) {
    return (
      <div
        className={`merge-cell merge-cell--empty${highlight ? ' merge-cell--highlight' : ''}`}
        onClick={onClick}
      />
    )
  }

  return (
    <div
      className={`merge-cell${highlight ? ' merge-cell--merging' : ''}`}
      style={{ backgroundColor: VALUE_COLORS[value] }}
      onClick={onClick}
      data-value={value}
    >
      {value}
    </div>
  )
})
