import { describe, it, expect } from 'vitest'
import { GameSyncService } from '../game-sync'
import type { GameRepository, DbGame, DbMove } from '../game-sync'
import type { StoredPiece, StoredGame, StoredMove } from '../persistence'

// In-memory fake repository
function createFakeRepo(): GameRepository & { games: DbGame[]; moves: DbMove[] } {
  const games: DbGame[] = []
  const moves: DbMove[] = []

  return {
    games,
    moves,
    async findActiveGame(gameType: string) {
      return games.find(g => g.game_type === gameType && g.status === 'in_progress') ?? null
    },
    async findMoves(gameId: string) {
      return moves.filter(m => m.game_id === gameId).sort((a, b) => a.move_number - b.move_number)
    },
    async insertGame(game: DbGame) {
      games.push(game)
    },
    async updateGame(id: string, patch: Partial<DbGame>) {
      const g = games.find(g => g.id === id)
      if (g) Object.assign(g, patch)
    },
    async upsertMoves(batch: DbMove[]) {
      for (const m of batch) {
        const idx = moves.findIndex(x => x.game_id === m.game_id && x.move_number === m.move_number)
        if (idx >= 0) moves[idx] = m
        else moves.push(m)
      }
    },
  }
}

const testPieces: StoredPiece[] = [
  { shape: 'line3h', color: 'blue' },
  { shape: 'square2', color: 'orange' },
  { shape: 'T1', color: 'purple' },
]

describe('GameSyncService', () => {
  describe('loadActiveGame', () => {
    it('returns null when no active game exists', async () => {
      const repo = createFakeRepo()
      const service = new GameSyncService(repo)
      const result = await service.loadActiveGame()
      expect(result).toBeNull()
    })

    it('returns the active game with its moves', async () => {
      const repo = createFakeRepo()
      repo.games.push({
        id: 'game-1',
        game_type: 'block-shapes',
        status: 'in_progress',
        score: 42,
        initial_pieces: testPieces,
      })
      repo.moves.push({
        game_id: 'game-1',
        move_number: 0,
        piece_index: 0,
        position_row: 0,
        position_col: 0,
        next_pieces: null,
      })

      const service = new GameSyncService(repo)
      const result = await service.loadActiveGame()

      expect(result).not.toBeNull()
      expect(result!.id).toBe('game-1')
      expect(result!.score).toBe(42)
      expect(result!.initial_pieces).toEqual(testPieces)
      expect(result!.moves).toHaveLength(1)
      expect(result!.moves[0].piece_index).toBe(0)
    })

    it('ignores game_over and abandoned games', async () => {
      const repo = createFakeRepo()
      repo.games.push({
        id: 'game-old',
        game_type: 'block-shapes',
        status: 'game_over',
        score: 100,
        initial_pieces: testPieces,
      })

      const service = new GameSyncService(repo)
      expect(await service.loadActiveGame()).toBeNull()
    })
  })

  describe('saveGame', () => {
    it('inserts a new game record in the repository', async () => {
      const repo = createFakeRepo()
      const service = new GameSyncService(repo)

      const game: StoredGame = {
        id: 'game-new',
        status: 'in_progress',
        score: 0,
        initial_pieces: testPieces,
        moves: [],
      }

      await service.saveGame(game)

      expect(repo.games).toHaveLength(1)
      expect(repo.games[0].id).toBe('game-new')
      expect(repo.games[0].initial_pieces).toEqual(testPieces)
      expect(repo.games[0].game_type).toBe('block-shapes')
    })
  })

  describe('flushMoves', () => {
    it('batch-upserts buffered moves to the repository', async () => {
      const repo = createFakeRepo()
      const service = new GameSyncService(repo)

      const moves: StoredMove[] = [
        { move_number: 0, piece_index: 0, position_row: 0, position_col: 0, next_pieces: null },
        { move_number: 1, piece_index: 1, position_row: 2, position_col: 3, next_pieces: null },
      ]

      await service.flushMoves('game-1', moves)

      expect(repo.moves).toHaveLength(2)
      expect(repo.moves[0].game_id).toBe('game-1')
      expect(repo.moves[1].move_number).toBe(1)
    })

    it('is idempotent — re-flushing same moves does not duplicate', async () => {
      const repo = createFakeRepo()
      const service = new GameSyncService(repo)

      const moves: StoredMove[] = [
        { move_number: 0, piece_index: 0, position_row: 0, position_col: 0, next_pieces: null },
      ]

      await service.flushMoves('game-1', moves)
      await service.flushMoves('game-1', moves)

      expect(repo.moves).toHaveLength(1)
    })
  })

  describe('endGame', () => {
    it('updates game status and score', async () => {
      const repo = createFakeRepo()
      repo.games.push({
        id: 'game-1',
        game_type: 'block-shapes',
        status: 'in_progress',
        score: 0,
        initial_pieces: testPieces,
      })

      const service = new GameSyncService(repo)
      await service.endGame('game-1', 500, 'game_over')

      expect(repo.games[0].status).toBe('game_over')
      expect(repo.games[0].score).toBe(500)
    })
  })

  describe('error resilience', () => {
    it('loadActiveGame returns null on repository error', async () => {
      const repo = createFakeRepo()
      repo.findActiveGame = async () => { throw new Error('DB down') }

      const service = new GameSyncService(repo)
      expect(await service.loadActiveGame()).toBeNull()
    })

    it('saveGame swallows repository errors', async () => {
      const repo = createFakeRepo()
      repo.insertGame = async () => { throw new Error('DB down') }

      const service = new GameSyncService(repo)
      // Should not throw
      await service.saveGame({
        id: 'game-x',
        status: 'in_progress',
        score: 0,
        initial_pieces: testPieces,
        moves: [],
      })
    })

    it('flushMoves swallows repository errors', async () => {
      const repo = createFakeRepo()
      repo.upsertMoves = async () => { throw new Error('DB down') }

      const service = new GameSyncService(repo)
      await service.flushMoves('game-1', [
        { move_number: 0, piece_index: 0, position_row: 0, position_col: 0, next_pieces: null },
      ])
      // No throw
    })
  })
})
