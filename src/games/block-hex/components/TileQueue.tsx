import type { Tile } from '../game/types'
import { COLOR_MAP } from './HexCell'

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
          <div className="tile-queue__hex-stack">
            {tile.map((color, layerIndex) => (
              <div
                key={layerIndex}
                className="tile-queue__hex-layer"
                style={{
                  backgroundColor: COLOR_MAP[color],
                  bottom: `${(tile.length - 1 - layerIndex) * 3}px`,
                  zIndex: layerIndex,
                  boxShadow: layerIndex === tile.length - 1
                    ? '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                    : '0 1px 2px rgba(0,0,0,0.2)',
                  filter: layerIndex === tile.length - 1 ? 'brightness(1.05)' : 'brightness(0.85)',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
