import { useState, useEffect } from 'react'
import { neonClient } from '../db'

type LeaderboardEntry = {
  user_id: string
  score: number
  game_type: string
  ended_at: string
}

type ChainableQuery = {
  eq: (col: string, val: unknown) => ChainableQuery
  order: (col: string, opts?: { ascending: boolean }) => ChainableQuery
  limit: (n: number) => ChainableQuery
  then: Promise<{ data: Record<string, unknown>[]; error: unknown }>['then']
}

type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => ChainableQuery
  }
}

function getLocalScores(): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = []
  const shapesScore = parseInt(localStorage.getItem('block-blast-high-score') || '0', 10)
  if (shapesScore > 0) {
    entries.push({ user_id: 'You', score: shapesScore, game_type: 'block-shapes', ended_at: '' })
  }
  const mergeScore = parseInt(localStorage.getItem('block-merge-high-score') || '0', 10)
  if (mergeScore > 0) {
    entries.push({ user_id: 'You', score: mergeScore, game_type: 'block-merge', ended_at: '' })
  }
  return entries
}

async function fetchLeaderboard(gameType: string, limit = 20): Promise<LeaderboardEntry[]> {
  // Try DB first
  if (import.meta.env.VITE_NEON_DATA_API_URL) {
    try {
      const client = neonClient as unknown as QueryClient
      const { data, error } = await client
        .from('games')
        .select('user_id,score,game_type,ended_at')
        .eq('status', 'game_over')
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(limit)

      if (!error && data && data.length > 0) {
        return data as unknown as LeaderboardEntry[]
      }
      if (error) console.warn('Leaderboard DB error:', error)
    } catch (e) {
      console.warn('Leaderboard DB failed:', e)
    }
  }

  // Fallback to localStorage high scores
  return getLocalScores().filter(e => e.game_type === gameType)
}

type LeaderboardProps = {
  onBack: () => void
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const [tab, setTab] = useState<'block-shapes' | 'block-merge'>('block-shapes')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchLeaderboard(tab).then(data => {
      setEntries(data)
      setLoading(false)
    })
  }, [tab])

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
                {entry.user_id.slice(0, 8)}...
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
