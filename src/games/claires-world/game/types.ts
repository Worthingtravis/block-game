export const BOARD_SIZE = 6
export const CLAIRE_COLORS = ['rose', 'sky', 'amber', 'mint', 'violet'] as const
export type ClaireColor = (typeof CLAIRE_COLORS)[number]

export const COLOR_VALUES: Record<ClaireColor, string> = {
  rose: '#F43F5E',
  sky: '#38BDF8',
  amber: '#F59E0B',
  mint: '#34D399',
  violet: '#A78BFA',
}

export type CellColor = ClaireColor | null

export type ClaireCell = {
  color: CellColor
  obstacle: boolean
  highlighted: boolean
}

export type Board = ClaireCell[][]

export type ClaireMode =
  | 'color-crush'
  | 'pattern-echo'
  | 'tile-slide'
  | 'speed-blitz'
  | 'mirror-world'
  | 'claires-challenge'

export type ClaireMood = 'neutral' | 'happy' | 'excited' | 'manic' | 'annoyed'
export type ModePhase = 'intro' | 'active' | 'outro' | 'transitioning'

export type DialogueTrigger =
  | 'start'
  | 'good_move'
  | 'bad_move'
  | 'mode_switch'
  | 'idle'
  | 'streak'
  | 'game_over'
  | 'zen'

export type GameState = {
  board: Board
  mode: ClaireMode
  modePhase: ModePhase
  score: number
  highScore: number
  claireMultiplier: number
  streak: number
  modesCompleted: number
  actionsRemaining: number
  gameOver: boolean
  claireMood: ClaireMood
  claireMessage: string | null
  // Color Crush specific
  selectedGroup: number[] | null
  // Pattern Echo specific
  echoSequence: number[]
  echoPlayerInput: number[]
  echoShowIndex: number
  echoErrors: number
  // Speed Blitz
  timerEndsAt: number | null
  // General
  lastAction: string | null
}

export type GameAction =
  | { type: 'TAP_CELL'; row: number; col: number }
  | { type: 'STEP' }
  | { type: 'START_MODE'; mode: ClaireMode }
  | { type: 'TRANSITION_DONE' }
  | { type: 'TIMER_TICK' }
  | { type: 'IDLE_TICK' }
  | { type: 'NEW_GAME' }
