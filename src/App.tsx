import { useState, lazy, Suspense } from 'react'

const BlockShapes = lazy(() => import('./games/block-shapes/BlockShapes'))

type GameId = 'menu' | 'block-shapes' | 'block-merge'

export default function App() {
  const [activeGame, setActiveGame] = useState<GameId>('menu')

  if (activeGame === 'block-shapes') {
    return (
      <Suspense fallback={<div className="game-loading">Loading...</div>}>
        <BlockShapes onBack={() => setActiveGame('menu')} />
      </Suspense>
    )
  }

  return (
    <div className="menu-container">
      <h1 className="menu-title">Block Games</h1>
      <p className="menu-subtitle">Choose a game</p>

      <div className="menu-grid">
        <button className="game-card" onClick={() => setActiveGame('block-shapes')}>
          <div className="game-card__preview game-card__preview--shapes">
            <div className="shapes-preview-grid">
              {['orange', 'green', 'purple', 'blue', 'pink', 'yellow', 'teal', 'red', 'indigo'].map((color, i) => (
                <div key={i} className="shapes-preview-cell" style={{ backgroundColor: `var(--${color})` }} />
              ))}
            </div>
          </div>
          <div className="game-card__info">
            <span className="game-card__name">Block Shapes</span>
            <span className="game-card__desc">Place shapes, clear lines</span>
          </div>
        </button>

        <button className="game-card game-card--locked" disabled>
          <div className="game-card__preview game-card__preview--merge">
            <div className="merge-preview-grid">
              {[2, 4, 8, 16, 32, 64, 128, 256, 512].map((n, i) => (
                <div key={i} className="merge-preview-cell" data-value={n}>
                  {n}
                </div>
              ))}
            </div>
          </div>
          <div className="game-card__info">
            <span className="game-card__name">Block Merge</span>
            <span className="game-card__tag">Coming Soon</span>
          </div>
        </button>
      </div>
    </div>
  )
}
