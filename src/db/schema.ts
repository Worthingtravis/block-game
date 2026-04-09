import { pgTable, uuid, text, integer, jsonb, timestamp, unique, index } from 'drizzle-orm/pg-core'

// user_id references auth.users(id) — enforced by RLS policy, not FK constraint,
// because drizzle-kit push can't see the auth schema through pooled connections
export const games = pgTable('games', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  userName: text('user_name'),
  gameType: text('game_type').notNull().default('block-shapes'),
  status: text().notNull().default('in_progress'),
  score: integer().notNull().default(0),
  initialPieces: jsonb('initial_pieces').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_games_user_status').on(t.userId, t.status),
])

export const moves = pgTable('moves', {
  id: uuid().primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  moveNumber: integer('move_number').notNull(),
  pieceIndex: integer('piece_index').notNull(),
  positionRow: integer('position_row').notNull(),
  positionCol: integer('position_col').notNull(),
  nextPieces: jsonb('next_pieces'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.gameId, t.moveNumber),
  index('idx_moves_game').on(t.gameId, t.moveNumber),
])
