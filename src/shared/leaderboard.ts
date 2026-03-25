export type LeaderboardEntry = {
  user_id: string
  score: number
  game_type: string
  ended_at: string
}

type QueryChain = {
  eq: (col: string, val: unknown) => QueryChain
  order: (col: string, opts?: { ascending: boolean }) => QueryChain
  limit: (n: number) => QueryChain
  then: PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }>['then']
}

export type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => QueryChain
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
  const hexScore = parseInt(localStorage.getItem('block-hex-high-score') || '0', 10)
  if (hexScore > 0) {
    entries.push({ user_id: 'You', score: hexScore, game_type: 'block-hex', ended_at: '' })
  }
  const clairesScore = parseInt(localStorage.getItem('claires-world-high-score') || '0', 10)
  if (clairesScore > 0) {
    entries.push({ user_id: 'You', score: clairesScore, game_type: 'claires-world', ended_at: '' })
  }
  return entries
}

export async function fetchLeaderboard(
  gameType: string,
  client: QueryClient | null,
  limit = 20,
): Promise<LeaderboardEntry[]> {
  if (client) {
    try {
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
    } catch {
      // Fall through to localStorage
    }
  }

  return getLocalScores().filter(e => e.game_type === gameType)
}
