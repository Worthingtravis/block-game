import { getValueColor, formatValue } from '../game/values'

type NextQueueProps = {
  queue: [number, number, number]
}

export default function NextQueue({ queue }: NextQueueProps) {
  return (
    <div className="next-queue">
      {queue.map((value, i) => (
        <div
          key={i}
          className={`next-queue__tile${i === 0 ? ' next-queue__tile--current' : ''}`}
          style={{ backgroundColor: getValueColor(value) }}
        >
          {formatValue(value)}
        </div>
      ))}
    </div>
  )
}
