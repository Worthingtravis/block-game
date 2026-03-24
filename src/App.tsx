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

type Page = 'menu' | 'block-shapes' | 'block-merge' | 'leaderboard'

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
