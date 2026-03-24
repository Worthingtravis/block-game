import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchLeaderboard, type LeaderboardEntry } from '../leaderboard'

// Mock query client that mimics the Neon PostgREST builder
function createMockClient(rows: Record<string, unknown>[] = [], error: unknown = null) {
  const chain = {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (val: { data: Record<string, unknown>[]; error: unknown }) => void) => {
      resolve({ data: rows, error })
    }),
  }
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => chain),
    })),
    _chain: chain,
  }
}

describe('fetchLeaderboard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns entries sorted by score from the DB client', async () => {
    const rows = [
      { user_id: 'aaa', score: 500, game_type: 'block-shapes', ended_at: '2026-01-01' },
      { user_id: 'bbb', score: 300, game_type: 'block-shapes', ended_at: '2026-01-02' },
    ]
    const client = createMockClient(rows)

    const entries = await fetchLeaderboard('block-shapes', client, 20)

    expect(entries).toHaveLength(2)
    expect(entries[0].score).toBe(500)
    expect(entries[1].score).toBe(300)
  })

  it('calls the correct query chain: from → select → eq(status) → eq(game_type) → order → limit', async () => {
    const client = createMockClient([])

    await fetchLeaderboard('block-merge', client, 10)

    expect(client.from).toHaveBeenCalledWith('games')
    const chain = client._chain
    expect(chain.eq).toHaveBeenCalledWith('status', 'game_over')
    expect(chain.eq).toHaveBeenCalledWith('game_type', 'block-merge')
    expect(chain.order).toHaveBeenCalledWith('score', { ascending: false })
    expect(chain.limit).toHaveBeenCalledWith(10)
  })

  it('returns empty array when DB returns an error', async () => {
    const client = createMockClient([], { message: 'connection failed' })

    const entries = await fetchLeaderboard('block-shapes', client, 20)

    expect(entries).toHaveLength(0)
  })

  it('returns empty array when DB returns null data', async () => {
    const chain = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (val: { data: null; error: null }) => void) => {
        resolve({ data: null, error: null })
      }),
    }
    const client = {
      from: vi.fn(() => ({ select: vi.fn(() => chain) })),
      _chain: chain,
    }

    const entries = await fetchLeaderboard('block-shapes', client, 20)

    expect(entries).toHaveLength(0)
  })

  it('falls back to localStorage high scores when client is null', async () => {
    localStorage.setItem('block-blast-high-score', '1234')

    const entries = await fetchLeaderboard('block-shapes', null, 20)

    expect(entries).toHaveLength(1)
    expect(entries[0].score).toBe(1234)
    expect(entries[0].user_id).toBe('You')
  })

  it('falls back to localStorage for block-merge', async () => {
    localStorage.setItem('block-merge-high-score', '567')

    const entries = await fetchLeaderboard('block-merge', null, 20)

    expect(entries).toHaveLength(1)
    expect(entries[0].score).toBe(567)
  })

  it('returns empty when no localStorage scores and no client', async () => {
    const entries = await fetchLeaderboard('block-shapes', null, 20)
    expect(entries).toHaveLength(0)
  })

  it('falls back to localStorage when client throws', async () => {
    localStorage.setItem('block-blast-high-score', '999')
    const client = {
      from: vi.fn(() => { throw new Error('network error') }),
      _chain: {},
    }

    const entries = await fetchLeaderboard('block-shapes', client, 20)

    expect(entries).toHaveLength(1)
    expect(entries[0].score).toBe(999)
  })
})
