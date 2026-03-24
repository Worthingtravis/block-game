import type { Tile, HexColor } from '../game/types'

const COLOR_MAP: Record<HexColor, string> = {
  blue: '#4a90d9',
  red: '#f44336',
  yellow: '#ffdd44',
  green: '#4caf50',
  purple: '#9c27b0',
}

type TileQueueProps = {
  queue: [Tile, Tile, Tile]
}

export default function TileQueue({ queue }: TileQueueProps) {
  return (
    <div className="tile-queue">
      {queue.map((tile, tileIndex) => (
        <div
          key={tileIndex}
          className={`tile-queue__tile${tileIndex === 0 ? ' tile-queue__tile--current' : ''}`}
          aria-label={tileIndex === 0 ? 'Current tile' : `Upcoming tile ${tileIndex + 1}`}
        >
          {tile.map((color, layerIndex) => (
            <div
              key={layerIndex}
              className="tile-queue__layer"
              style={{ backgroundColor: COLOR_MAP[color] }}
              aria-label={color}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
