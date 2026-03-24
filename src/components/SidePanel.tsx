import { authClient } from '../auth'

type Page = 'menu' | 'block-shapes' | 'block-merge' | 'block-hex' | 'leaderboard'

type SidePanelProps = {
  open: boolean
  onClose: () => void
  onNavigate: (page: Page) => void
  currentPage: Page
}

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'menu', label: 'Home', icon: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10' },
  { id: 'block-shapes', label: 'Block Shapes', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4z' },
  { id: 'block-merge', label: 'Block Merge', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { id: 'block-hex', label: 'Hexa Sort', icon: 'M12 2l9 5v10l-9 5-9-5V7z' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'M8 21V11M16 21V7M12 21V3' },
]

export default function SidePanel({ open, onClose, onNavigate, currentPage }: SidePanelProps) {
  const session = authClient.useSession()

  return (
    <>
      {open && <div className="side-panel__backdrop" onClick={onClose} />}
      <div className={`side-panel${open ? ' side-panel--open' : ''}`}>
        <div className="side-panel__header">
          <span className="side-panel__brand">Block Games</span>
          <button className="side-panel__close" onClick={onClose} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="side-panel__nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`side-panel__item${currentPage === item.id ? ' side-panel__item--active' : ''}`}
              onClick={() => { onNavigate(item.id); onClose() }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="side-panel__footer">
          {session.data ? (
            <>
              <div className="side-panel__user-info">
                <div className="side-panel__avatar">
                  {(session.data.user.name || session.data.user.email || '?')[0].toUpperCase()}
                </div>
                <span>{session.data.user.name || session.data.user.email}</span>
              </div>
              <button className="side-panel__signout" onClick={() => { authClient.signOut(); onClose() }}>
                Sign out
              </button>
            </>
          ) : (
            <div className="side-panel__auth-buttons">
              <button className="side-panel__signin" onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/' })}>
                Sign in with Google
              </button>
              <button className="side-panel__signin side-panel__signin--secondary" onClick={() => authClient.signIn.social({ provider: 'github', callbackURL: '/' })}>
                Sign in with GitHub
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
