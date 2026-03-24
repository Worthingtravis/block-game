import { authClient } from '../auth'

type NavbarProps = {
  onMenuToggle: () => void
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const session = authClient.useSession()

  return (
    <nav className="navbar">
      <button className="navbar__hamburger" onClick={onMenuToggle} aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <span className="navbar__title">Block Games</span>

      <div className="navbar__profile">
        {session.isPending ? null : session.data ? (
          <div className="navbar__user">
            <span className="navbar__username">{session.data.user.name || session.data.user.email}</span>
            <button className="navbar__btn" onClick={() => authClient.signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="navbar__auth">
            <button className="navbar__btn navbar__btn--primary" onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/' })}>
              Sign in
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
