-- Games table: one row per game session
CREATE TABLE IF NOT EXISTS games (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type     text NOT NULL DEFAULT 'block-shapes',
  status        text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'game_over', 'abandoned')),
  score         integer NOT NULL DEFAULT 0,
  initial_pieces jsonb NOT NULL,  -- the first 3 pieces dealt
  started_at    timestamptz NOT NULL DEFAULT now(),
  ended_at      timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Moves table: one row per piece placement, ordered by move_number
CREATE TABLE IF NOT EXISTS moves (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  move_number   integer NOT NULL,
  piece_index   integer NOT NULL,  -- 0, 1, or 2 (which slot was placed)
  position_row  integer NOT NULL,
  position_col  integer NOT NULL,
  -- When all 3 pieces are placed, a new set is dealt. Store it here.
  next_pieces   jsonb,            -- null unless this move triggered a new piece set
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, move_number)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_games_user_status ON games(user_id, status);
CREATE INDEX IF NOT EXISTS idx_moves_game ON moves(game_id, move_number);

-- Row Level Security: users can only access their own games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY games_user_policy ON games
  FOR ALL USING (user_id = auth.user_id());

CREATE POLICY moves_user_policy ON moves
  FOR ALL USING (
    game_id IN (SELECT id FROM games WHERE user_id = auth.user_id())
  );
