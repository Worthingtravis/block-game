import { useState, useMemo, lazy, Suspense } from 'react'
import { authClient } from './auth'
import { GameSyncService } from './games/block-shapes/game-sync'
import { createNeonRepository } from './games/block-shapes/neon-repository'
import { neonClient } from './db'
import Navbar from './components/Navbar'
import SidePanel from './components/SidePanel'
import Leaderboard from './components/Leaderboard'
import { useSettings } from './shared/useSettings'

const BlockShapes = lazy(() => import('./games/block-shapes/BlockShapes'))
const BlockMerge = lazy(() => import('./games/block-merge/BlockMerge'))
const BlockHex = lazy(() => import('./games/block-hex/BlockHex'))

type Page = 'menu' | 'block-shapes' | 'block-merge' | 'block-hex' | 'leaderboard'

/* Mini honeycomb preview for the Hexa Sort menu card */
const HEX_PREVIEW_ROWS = [
  { cells: ['#4a90d9', '#f44336', '#ffdd44'], count: 3 },
  { cells: ['#4caf50', '#9c27b0', '#4a90d9', '#f44336'], count: 4 },
  { cells: ['#ffdd44', '#4caf50', '#9c27b0', '#4a90d9', '#f44336'], count: 5 },
  { cells: ['#ffdd44', '#4caf50', '#9c27b0', '#4a90d9'], count: 4 },
  { cells: ['#f44336', '#ffdd44', '#4caf50'], count: 3 },
]

function HexPreview() {
  const maxCols = 5
  let key = 0
  return (
    <div className="hex-preview-grid">
      {HEX_PREVIEW_ROWS.map((row, rowIdx) =>
        row.cells.map((color, colIdx) => {
          const offset = (maxCols - row.count) / 2
          const x = (colIdx + offset) // in units of --pw
          const y = rowIdx            // in units of --pr
          return (
            <div
              key={key++}
              className="hex-preview-cell"
              style={{
                backgroundColor: color,
                left: `calc(${x} * var(--pw))`,
                top: `calc(${y} * var(--pr))`,
              }}
            />
          )
        })
      )}
    </div>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>('menu')
  const [sideOpen, setSideOpen] = useState(false)
  const session = authClient.useSession()
  useSettings() // Apply theme on app startup

  const syncService = useMemo(() => {
    if (!session.data || !import.meta.env.VITE_NEON_DATA_API_URL) return null
    const repo = createNeonRepository(neonClient as unknown as Parameters<typeof createNeonRepository>[0])
    return new GameSyncService(repo)
  }, [session.data])

  const navigate = (page: Page) => setActivePage(page)

  if (activePage === 'block-shapes') {
    return (
      <Suspense fallback={<div className="game-loading">Loading...</div>}>
        <BlockShapes onBack={() => setActivePage('menu')} syncService={syncService} />
      </Suspense>
    )
  }

  if (activePage === 'block-merge') {
    return (
      <Suspense fallback={<div className="game-loading">Loading...</div>}>
        <BlockMerge onBack={() => setActivePage('menu')} />
      </Suspense>
    )
  }

  if (activePage === 'block-hex') {
    return (
      <Suspense fallback={<div className="game-loading">Loading...</div>}>
        <BlockHex onBack={() => setActivePage('menu')} />
      </Suspense>
    )
  }

  if (activePage === 'leaderboard') {
    return (
      <>
        <Navbar onMenuToggle={() => setSideOpen(true)} />
        <SidePanel open={sideOpen} onClose={() => setSideOpen(false)} onNavigate={navigate} currentPage={activePage} />
        <Leaderboard onBack={() => setActivePage('menu')} />
      </>
    )
  }

  return (
    <>
      <Navbar onMenuToggle={() => setSideOpen(true)} />
      <SidePanel open={sideOpen} onClose={() => setSideOpen(false)} onNavigate={navigate} currentPage={activePage} />

      <div className="menu-container">
        <h1 className="menu-title">Choose a game</h1>

        <div className="menu-grid">
          <button className="game-card" onClick={() => setActivePage('block-shapes')}>
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

          <button className="game-card" onClick={() => setActivePage('block-merge')}>
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
              <span className="game-card__desc">Merge numbers, chain reactions</span>
            </div>
          </button>

          <button className="game-card" onClick={() => setActivePage('block-hex')}>
            <div className="game-card__preview game-card__preview--hex">
              <HexPreview />
            </div>
            <div className="game-card__info">
              <span className="game-card__name">Hexa Sort</span>
              <span className="game-card__desc">Sort colors, chain matches</span>
            </div>
          </button>
        </div>

        <button className="leaderboard-btn" onClick={() => setActivePage('leaderboard')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21V11M16 21V7M12 21V3" />
          </svg>
          Leaderboard
        </button>
      </div>
    </>
  )
}
