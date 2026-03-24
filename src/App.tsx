import { useState, useMemo, lazy, Suspense } from 'react'
import { authClient } from './auth'
import { GameSyncService } from './games/block-shapes/game-sync'
import { createNeonRepository } from './games/block-shapes/neon-repository'
import { neonClient } from './db'

const BlockShapes = lazy(() => import('./games/block-shapes/BlockShapes'))
const BlockMerge = lazy(() => import('./games/block-merge/BlockMerge'))

type GameId = 'menu' | 'block-shapes' | 'block-merge'

function UserBar() {
  const session = authClient.useSession()

  if (session.isPending) return null

  if (!session.data) {
    return (
      <div className="user-bar">
        <button className="user-bar__btn" onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/' })}>
          Sign in with Google
        </button>
        <button className="user-bar__btn user-bar__btn--secondary" onClick={() => authClient.signIn.social({ provider: 'github', callbackURL: '/' })}>
          Sign in with GitHub
        </button>
      </div>
    )
  }

  return (
    <div className="user-bar">
      <span className="user-bar__name">{session.data.user.name || session.data.user.email}</span>
      <button className="user-bar__btn user-bar__btn--secondary" onClick={() => authClient.signOut()}>
        Sign out
      </button>
    </div>
  )
}

export default function App() {
  const [activeGame, setActiveGame] = useState<GameId>('menu')
  const session = authClient.useSession()

  // Create sync service only when signed in and Data API is configured
  const syncService = useMemo(() => {
    if (!session.data || !import.meta.env.VITE_NEON_DATA_API_URL) return null
    const repo = createNeonRepository(neonClient as unknown as Parameters<typeof createNeonRepository>[0])
    return new GameSyncService(repo)
  }, [session.data])

  if (activeGame === 'block-shapes') {
    return (
      <Suspense fallback={<div className="game-loading">Loading...</div>}>
        <BlockShapes onBack={() => setActiveGame('menu')} syncService={syncService} />
      </Suspense>
    )
  }

  if (activeGame === 'block-merge') {
    return (
      <Suspense fallback={<div className="game-loading">Loading...</div>}>
        <BlockMerge onBack={() => setActiveGame('menu')} />
      </Suspense>
    )
  }

  return (
    <div className="menu-container">
      <UserBar />

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

        <button className="game-card" onClick={() => setActiveGame('block-merge')}>
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
    </div>
  )
}
