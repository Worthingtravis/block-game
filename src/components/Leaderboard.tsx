import { useState, useEffect, useMemo } from 'react'
import { neonClient } from '../db'
import { fetchLeaderboard, type LeaderboardEntry, type QueryClient } from '../shared/leaderboard'

type LeaderboardProps = {
  onBack: () => void
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const [tab, setTab] = useState<'block-shapes' | 'block-merge'>('block-shapes')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const client = useMemo<QueryClient | null>(() => {
    if (!import.meta.env.VITE_NEON_DATA_API_URL) return null
    return neonClient as unknown as QueryClient
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchLeaderboard(tab, client).then(data => {
      setEntries(data)
      setLoading(false)
    })
  }, [tab, client])

  return (
    <div className="leaderboard">
      <div className="leaderboard__header">
        <button className="back-btn" onClick={onBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1>Leaderboard</h1>
      </div>

      <div className="leaderboard__tabs">
        <button
          className={`leaderboard__tab${tab === 'block-shapes' ? ' leaderboard__tab--active' : ''}`}
          onClick={() => setTab('block-shapes')}
        >
          Block Shapes
        </button>
        <button
          className={`leaderboard__tab${tab === 'block-merge' ? ' leaderboard__tab--active' : ''}`}
          onClick={() => setTab('block-merge')}
        >
          Block Merge
        </button>
      </div>

      {loading ? (
        <div className="leaderboard__loading">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="leaderboard__empty">
          No scores yet. Play a game to get on the board!
        </div>
      ) : (
        <div className="leaderboard__list">
          {entries.map((entry, i) => (
            <div key={`${entry.user_id}-${entry.ended_at}-${i}`} className={`leaderboard__row${i < 3 ? ` leaderboard__row--top${i + 1}` : ''}`}>
              <span className="leaderboard__rank">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <span className="leaderboard__player">
                {entry.user_name || (entry.user_id === 'You' ? 'You' : entry.user_id.slice(0, 8) + '...')}
              </span>
              <span className="leaderboard__score">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
