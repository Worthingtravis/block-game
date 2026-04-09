import type { StoredGame, StoredMove, StoredPiece, GameStatus } from './persistence'

export type DbGame = {
  id: string
  user_id: string
  user_name: string | null
  game_type: string
  status: GameStatus
  score: number
  initial_pieces: StoredPiece[]
}

export type DbMove = {
  game_id: string
  move_number: number
  piece_index: number
  position_row: number
  position_col: number
  next_pieces: StoredPiece[] | null
}

export interface GameRepository {
  findActiveGame(gameType: string, userId: string): Promise<DbGame | null>
  findMoves(gameId: string): Promise<DbMove[]>
  insertGame(game: DbGame): Promise<void>
  updateGame(id: string, patch: Partial<DbGame>): Promise<void>
  upsertMoves(batch: DbMove[]): Promise<void>
}

export class GameSyncService {
  #repo: GameRepository
  #userId: string
  #userName: string | null
  constructor(repo: GameRepository, userId: string, userName: string | null) {
    this.#repo = repo
    this.#userId = userId
    this.#userName = userName
  }

  async loadActiveGame(): Promise<StoredGame | null> {
    try {
      const dbGame = await this.#repo.findActiveGame('block-shapes', this.#userId)
      if (!dbGame) return null

      const dbMoves = await this.#repo.findMoves(dbGame.id)

      return {
        id: dbGame.id,
        status: dbGame.status,
        score: dbGame.score,
        initial_pieces: dbGame.initial_pieces,
        moves: dbMoves.map(m => ({
          move_number: m.move_number,
          piece_index: m.piece_index,
          position_row: m.position_row,
          position_col: m.position_col,
          next_pieces: m.next_pieces,
        })),
      }
    } catch {
      return null
    }
  }

  async saveGame(game: StoredGame): Promise<void> {
    try {
      await this.#repo.insertGame({
        id: game.id,
        user_id: this.#userId,
        user_name: this.#userName,
        game_type: 'block-shapes',
        status: game.status,
        score: game.score,
        initial_pieces: game.initial_pieces,
      })
    } catch { /* non-fatal */ }
  }

  async flushMoves(gameId: string, moves: StoredMove[]): Promise<void> {
    try {
      await this.#repo.upsertMoves(moves.map(m => ({
        game_id: gameId,
        move_number: m.move_number,
        piece_index: m.piece_index,
        position_row: m.position_row,
        position_col: m.position_col,
        next_pieces: m.next_pieces,
      })))
    } catch { /* non-fatal */ }
  }

  async endGame(gameId: string, score: number, status: GameStatus): Promise<void> {
    try {
      await this.#repo.updateGame(gameId, { status, score })
    } catch { /* non-fatal */ }
  }
}
