import type { GameRepository, DbGame, DbMove } from './game-sync'

// Structural type matching the Neon client's query builder
type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => ChainableQuery
    insert: (row: Record<string, unknown>) => ChainableQuery
    update: (patch: Record<string, unknown>) => ChainableQuery
    upsert: (row: Record<string, unknown>, opts?: { onConflict: string }) => ChainableQuery
  }
}

type ChainableQuery = {
  eq: (col: string, val: unknown) => ChainableQuery
  order: (col: string, opts?: { ascending: boolean }) => ChainableQuery
  limit: (n: number) => ChainableQuery
  single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>
  then: Promise<{ data: Record<string, unknown>[]; error: unknown }>['then']
}

function moveToRow(m: DbMove): Record<string, unknown> {
  return {
    game_id: m.game_id,
    move_number: m.move_number,
    piece_index: m.piece_index,
    position_row: m.position_row,
    position_col: m.position_col,
    next_pieces: m.next_pieces,
  }
}

export function createNeonRepository(client: QueryClient): GameRepository {
  return {
    async findActiveGame(gameType: string): Promise<DbGame | null> {
      const { data, error } = await client
        .from('games')
        .select('*')
        .eq('game_type', gameType)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null
      return data as unknown as DbGame
    },

    async findMoves(gameId: string): Promise<DbMove[]> {
      const { data, error } = await client
        .from('moves')
        .select('*')
        .eq('game_id', gameId)
        .order('move_number', { ascending: true })

      if (error || !data) return []
      return data as unknown as DbMove[]
    },

    async insertGame(game: DbGame): Promise<void> {
      await client.from('games').insert({
        id: game.id,
        game_type: game.game_type,
        status: game.status,
        score: game.score,
        initial_pieces: game.initial_pieces,
      })
    },

    async updateGame(id: string, patch: Partial<DbGame>): Promise<void> {
      await client.from('games').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    },

    async upsertMoves(batch: DbMove[]): Promise<void> {
      await Promise.all(batch.map(m =>
        client.from('moves').upsert(moveToRow(m), { onConflict: 'game_id,move_number' })
      ))
    },
  }
}
