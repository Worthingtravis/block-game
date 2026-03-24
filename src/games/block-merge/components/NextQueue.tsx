import type { MergeValue } from '../game/types'
import { VALUE_COLORS } from '../game/types'

type NextQueueProps = {
  queue: [MergeValue, MergeValue, MergeValue]
}

export default function NextQueue({ queue }: NextQueueProps) {
  return (
    <div className="next-queue">
      {queue.map((value, i) => (
        <div
          key={i}
          className={`next-queue__tile${i === 0 ? ' next-queue__tile--current' : ''}`}
          style={{ backgroundColor: VALUE_COLORS[value] }}
        >
          {value}
        </div>
      ))}
    </div>
  )
}
