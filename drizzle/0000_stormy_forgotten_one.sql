CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_type" text DEFAULT 'block-shapes' NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"initial_pieces" jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"move_number" integer NOT NULL,
	"piece_index" integer NOT NULL,
	"position_row" integer NOT NULL,
	"position_col" integer NOT NULL,
	"next_pieces" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moves_game_id_move_number_unique" UNIQUE("game_id","move_number")
);
--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_games_user_status" ON "games" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_moves_game" ON "moves" USING btree ("game_id","move_number");