import type { GameState } from '../types'
import { findGroup, clearGroup, applyGravity, fillEmpty } from '../engine'
import { getDifficulty } from '../../dialogue/claire-ai'

export function handleCrushTap(state: GameState, row: number, col: number): GameState {
  const cell = state.board[row]?.[col]
  if (!cell || cell.color === null || cell.obstacle) return state

  const group = findGroup(state.board, row, col)

  const { colorCount } = getDifficulty(state.modesCompleted)
  const minGroupSize = getDifficulty(state.modesCompleted).minGroupSize

  if (group.length < minGroupSize) {
    // Bad move — not enough connected cells
    return {
      ...state,
      lastAction: 'bad_move',
    }
  }

  const points = group.length * group.length * 2
  const newStreak = state.streak + 1
  const newMultiplier = Math.min(state.claireMultiplier + (group.length >= 5 ? 0.5 : 0), 5)

  let newBoard = clearGroup(state.board, group)
  newBoard = applyGravity(newBoard)
  newBoard = fillEmpty(newBoard, colorCount)

  const newScore = state.score + Math.round(points * state.claireMultiplier)
  const newHighScore = Math.max(newScore, state.highScore)
  const newActionsRemaining = state.actionsRemaining - 1

  return {
    ...state,
    board: newBoard,
    score: newScore,
    highScore: newHighScore,
    streak: newStreak,
    claireMultiplier: newMultiplier,
    actionsRemaining: newActionsRemaining,
    selectedGroup: null,
    lastAction: 'good_move',
  }
}
