import { motion } from 'motion/react'
import type { TileVM } from '../block-hex.vm'
import { HEX_COLORS } from '../block-hex.vm'

type TileQueueProps = {
  tiles: [TileVM, TileVM, TileVM]
}

const LAYER_OFFSET = 3

export default function TileQueue({ tiles }: TileQueueProps) {
  return (
    <div className="tile-queue">
      {tiles.map((tile, i) => (
        <motion.div
          key={i}
          className={`tile-queue__tile${tile.isCurrent ? ' tile-queue__tile--current' : ''}`}
          animate={{
            scale: tile.isCurrent ? 1 : 0.75,
            opacity: tile.isCurrent ? 1 : 0.4,
          }}
          whileHover={tile.isCurrent ? { scale: 1.08, y: -4 } : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="tile-queue__hex-stack">
            {tile.layers.map((color, layerIndex, arr) => {
              const isTop = layerIndex === arr.length - 1
              const depth = (arr.length - 1 - layerIndex) * LAYER_OFFSET
              const colors = HEX_COLORS[color]
              return (
                <div
                  key={layerIndex}
                  className={`tile-queue__hex-disc${isTop ? ' tile-queue__hex-disc--top' : ''}`}
                  style={{
                    '--disc-face': colors.face,
                    '--disc-edge': colors.edge,
                    '--disc-depth': `${depth}px`,
                  } as React.CSSProperties}
                />
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
