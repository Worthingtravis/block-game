import type { GameState } from '../types'
import { BOARD_SIZE } from '../types'

export function initEcho(state: GameState, sequenceLength: number): GameState {
  const totalCells = BOARD_SIZE * BOARD_SIZE
  const sequence: number[] = []

  for (let i = 0; i < sequenceLength; i++) {
    sequence.push(Math.floor(Math.random() * totalCells))
  }

  return {
    ...state,
    echoSequence: sequence,
    echoPlayerInput: [],
    echoShowIndex: 0,
    echoErrors: 0,
    lastAction: null,
  }
}

export function handleEchoTap(state: GameState, row: number, col: number): GameState {
  const cellIndex = row * BOARD_SIZE + col
  const expectedIndex = state.echoPlayerInput.length
  const expected = state.echoSequence[expectedIndex]

  if (cellIndex === expected) {
    // Correct tap
    const newInput = [...state.echoPlayerInput, cellIndex]
    const isComplete = newInput.length === state.echoSequence.length

    const points = isComplete ? state.echoSequence.length * 10 : 5
    const newScore = state.score + Math.round(points * state.claireMultiplier)
    const newHighScore = Math.max(newScore, state.highScore)

    return {
      ...state,
      echoPlayerInput: newInput,
      score: newScore,
      highScore: newHighScore,
      streak: state.streak + (isComplete ? 1 : 0),
      actionsRemaining: isComplete ? state.actionsRemaining - 1 : state.actionsRemaining,
      lastAction: isComplete ? 'good_move' : null,
    }
  } else {
    // Wrong tap
    return {
      ...state,
      echoErrors: state.echoErrors + 1,
      echoPlayerInput: [],
      streak: 0,
      claireMultiplier: Math.max(state.claireMultiplier - 0.5, 1),
      actionsRemaining: state.actionsRemaining - 1,
      lastAction: 'bad_move',
    }
  }
}

export function advanceEchoShow(state: GameState): GameState {
  const nextIndex = state.echoShowIndex + 1
  const isDone = nextIndex >= state.echoSequence.length

  return {
    ...state,
    echoShowIndex: isDone ? state.echoShowIndex : nextIndex,
    lastAction: isDone ? 'echo_show_done' : null,
  }
}
