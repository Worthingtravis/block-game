import type { GameState, ClaireMode, ClaireMood, DialogueTrigger } from '../game/types'
import { CLAIRE_LINES } from './lines'

const ALL_MODES: ClaireMode[] = [
  'color-crush',
  'pattern-echo',
  'tile-slide',
  'speed-blitz',
  'mirror-world',
  'claires-challenge',
]

// Base weights for each mode — Claire prefers variety and targeting weaknesses
const MODE_BASE_WEIGHTS: Record<ClaireMode, number> = {
  'color-crush': 3,
  'pattern-echo': 2,
  'tile-slide': 2,
  'speed-blitz': 2,
  'mirror-world': 2,
  'claires-challenge': 1,
}

export function selectNextMode(state: GameState): ClaireMode {
  const current = state.mode
  const candidates = ALL_MODES.filter(m => m !== current)

  // After many modes completed, boost challenge modes
  const weights = candidates.map(m => {
    let w = MODE_BASE_WEIGHTS[m]
    // Increase speed-blitz if player is doing well (high streak)
    if (m === 'speed-blitz' && state.streak >= 3) w += 2
    // Increase pattern-echo if score is high (they need mental challenge)
    if (m === 'pattern-echo' && state.score > 500) w += 1
    // Boost claires-challenge once player has seen a few modes
    if (m === 'claires-challenge' && state.modesCompleted >= 3) w += 2
    // Reduce weight if mode was recently played (can't detect without history, use modesCompleted parity)
    return w
  })

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let roll = Math.random() * totalWeight

  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return candidates[i]
  }

  return candidates[candidates.length - 1]
}

export function pickDialogue(trigger: DialogueTrigger, _state: GameState): string {
  const lines = CLAIRE_LINES[trigger]
  return lines[Math.floor(Math.random() * lines.length)]
}

export function updateMood(state: GameState, event: string): ClaireMood {
  const { claireMultiplier, streak } = state

  if (event === 'bad_move') {
    if (claireMultiplier <= 1) return 'annoyed'
    return 'neutral'
  }

  if (event === 'game_over') return 'happy'

  if (event === 'streak' || streak >= 5) return 'manic'

  if (claireMultiplier >= 3 || streak >= 3) return 'excited'

  if (claireMultiplier >= 2 || streak >= 1) return 'happy'

  return 'neutral'
}

export function getActionsForMode(mode: ClaireMode, modesCompleted: number): number {
  // Base actions per mode, reduced as game progresses (more pressure)
  const pressure = Math.max(0, modesCompleted - 2)

  const base: Record<ClaireMode, number> = {
    'color-crush': 12,
    'pattern-echo': 6,
    'tile-slide': 10,
    'speed-blitz': 8,
    'mirror-world': 10,
    'claires-challenge': 8,
  }

  const reduction = Math.min(pressure * 1, 4) // max -4 actions
  return Math.max(base[mode] - reduction, 4)
}

export type DifficultyConfig = {
  colorCount: number
  echoLength: number
  blitzSeconds: number
  minGroupSize: number
  obstacleChance: number
}

export function getDifficulty(modesCompleted: number): DifficultyConfig {
  // Start easy, ramp up
  const stage = Math.min(modesCompleted, 8)

  const colorCount = stage < 2 ? 3 : stage < 4 ? 4 : 5

  const echoLength = Math.min(3 + Math.floor(stage / 2), 8)

  const blitzSeconds = Math.max(30 - stage * 2, 12)

  // minGroupSize: start at 3, eventually 4 to be mean
  const minGroupSize = stage >= 6 ? 4 : 3

  // small chance of obstacles appearing after stage 3
  const obstacleChance = stage >= 4 ? 0.05 + (stage - 4) * 0.02 : 0

  return { colorCount, echoLength, blitzSeconds, minGroupSize, obstacleChance }
}
